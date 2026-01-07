"use client"

import { useState, useEffect} from "react"
import {Loader2, CheckCircle2, XCircle} from "lucide-react"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import {PhoneInput} from "@/components/ui/base-phone-input";
import {thousandSeparator} from "@/lib/utils";
import {TelcoOperators, PricingTiers} from "@/lib/constants";
import {zodResolver} from "@hookform/resolvers/zod"
import {Controller, useForm} from "react-hook-form"
import {
    Field,
    FieldError,
    FieldLabel,
} from "@/components/ui/field"
import * as z from "zod"
import {
    queryPaymentStatus,
    processPayment,
    previewUssdPushRequest
} from "@/lib/actions/clickpesa/initiatepayment.actions"
import {
    NumberField,
    NumberFieldDecrement,
    NumberFieldGroup,
    NumberFieldIncrement,
    NumberFieldInput,
} from "@/components/ui/number-field"
import Image from "next/image";

const formSchema = z.object({
    mobile: z.string().transform((val) => val.replace(/^\+/, ""))
})

type AvailableMethod = {
    name: string
    status: "AVAILABLE" | "UNAVAILABLE"
    fee?: number
    message?: string
}

export default function SMSPricingCalculator({tenantName}: { tenantName: string | undefined }) {
    const [smsQuantity, setSmsQuantity] = useState<number>(0)
    const [pricePerSms, setPricePerSms] = useState<number>(0)
    const [totalPrice, setTotalPrice] = useState<number>(0)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false)
    const [isPaymentPending, setIsPaymentPending] = useState(false)
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)
    const [paymentId, setPaymentId] = useState<string>("")
    const [orderReference, setOrderReference] = useState<string>("")
    const [paymentError, setPaymentError] = useState<string>("")
    const [processingMessage, setProcessingMessage] = useState<string>("")
    const [phoneNumber, setPhoneNumber] = useState<string>("")
    const [availableMethods, setAvailableMethods] = useState<AvailableMethod[]>([])
    const [isLoadingMethods, setIsLoadingMethods] = useState(false)
    const [transactionFee, setTransactionFee] = useState<number>(0)

    // ⏱️ PIN Entry Countdown Timer
    const [pinTimeRemaining, setPinTimeRemaining] = useState<number>(90) // 90 seconds

    useEffect(() => {
        if (smsQuantity > 0) {
            const tier = [...PricingTiers].reverse().find((tier) => smsQuantity >= tier.minSms) || PricingTiers[0]
            setPricePerSms(tier.price)
            setTotalPrice(smsQuantity * tier.price)
        } else {
            setPricePerSms(0)
            setTotalPrice(0)
        }
    }, [smsQuantity])

    // Fetch available methods when SMS quantity changes
    useEffect(() => {
        const fetchAvailableMethods = async () => {
            if (totalPrice === 0) {
                setAvailableMethods([])
                setTransactionFee(0)
                return
            }

            setIsLoadingMethods(true)
            try {
                const orderRef = generateOrderReference(tenantName)
                const dummyPhone = "255700000000"

                const result = await previewUssdPushRequest(
                    totalPrice,
                    dummyPhone,
                    orderRef,
                    false
                )

                if (result.success && result.data?.activeMethods) {
                    setAvailableMethods(result.data.activeMethods)

                    const firstAvailableMethod = result.data.activeMethods.find(
                        (method) => method.status === "AVAILABLE" && method.fee !== undefined
                    )

                    const fee = firstAvailableMethod?.fee || 0
                    setTransactionFee(fee)
                } else {
                    setAvailableMethods([])
                    setTransactionFee(0)
                }
            } catch (error) {
                console.error("Error fetching available methods:", error)
                setAvailableMethods([])
                setTransactionFee(0)
            } finally {
                setIsLoadingMethods(false)
            }
        }

        const timeoutId = setTimeout(fetchAvailableMethods, 500)
        return () => clearTimeout(timeoutId)
    }, [totalPrice, tenantName])

    // ⏱️ PIN Entry Countdown Timer Effect
    useEffect(() => {
        if (!isPaymentPending || isPaymentProcessing) {
            return
        }

        // Reset timer when payment pending starts
        setPinTimeRemaining(90)

        const countdown = setInterval(() => {
            setPinTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(countdown)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(countdown)
    }, [isPaymentPending, isPaymentProcessing])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            mobile: ""
        },
    })

    // 🎯 STRICT POLLING: Only while pending, hard stop after timeout
    useEffect(() => {
        if (!orderReference || !isPaymentPending) {
            console.log('🚫 Polling stopped - not pending');
            return;
        }

        let pollInterval: NodeJS.Timeout | null = null;
        let initialTimeout: NodeJS.Timeout | null = null;
        let attempts = 0;
        const MAX_ATTEMPTS = 30;
        let isPolling = true;

        const checkPaymentStatus = async () => {
            if (!isPolling) {
                console.log('🛑 Polling stopped - state changed');
                if (pollInterval) clearInterval(pollInterval);
                return;
            }

            try {
                attempts++;
                console.log(`📊 Polling attempt ${attempts}/${MAX_ATTEMPTS} for order: ${orderReference}`);

                const response = await queryPaymentStatus(orderReference);

                // Check API success first
                if (!response.success) {
                    console.error('❌ API call failed:', response.message);
                    return; // Continue polling on API errors
                }

                const data = response.data;

                // Check if data is valid array
                if (!data || data.length === 0) {
                    console.warn('⚠️ No payment data returned');
                    return; // Continue polling
                }

                const payment = data[0];
                console.log(`📊 Payment status: ${payment.status}`);

                // ✅ SUCCESS - Stop polling
                if (payment.status === 'SUCCESS' || payment.status === 'SETTLED') {
                    isPolling = false;
                    if (pollInterval) clearInterval(pollInterval);
                    console.log('✅ Payment SUCCESS - stopping poll');
                    await handlePaymentSuccess(payment.id || paymentId, orderReference);
                    return;
                }

                // ❌ FAILED - Stop polling
                if (payment.status === 'FAILED' || payment.status === 'REJECTED') {
                    isPolling = false;
                    if (pollInterval) clearInterval(pollInterval);
                    console.log('❌ Payment FAILED - stopping poll');
                    handlePaymentFailure(payment.message || 'Payment failed');
                    return;
                }

                // 🔄 PROCESSING/PENDING - Continue polling (don't stop!)
                if (payment.status === 'PROCESSING' || payment.status === 'PENDING') {
                    console.log('🔄 Payment still processing... continuing poll');
                    await handlePaymentProcessing(payment.status, payment.message);
                }

                // ⏰ Timeout after max attempts
                if (attempts >= MAX_ATTEMPTS) {
                    isPolling = false;
                    if (pollInterval) clearInterval(pollInterval);
                    console.log('⏰ Polling TIMEOUT - hard stop');
                    setIsPaymentPending(false);
                    setPaymentError(
                        'Payment confirmation timeout. If money was deducted, please contact support with order reference: ' + orderReference
                    );
                    return;
                }

            } catch (error) {
                console.error('❌ Polling error:', error);
                // Continue polling on network errors
            }
        };

        console.log('🚀 Starting payment status polling...');
        initialTimeout = setTimeout(() => {
            checkPaymentStatus();
            pollInterval = setInterval(checkPaymentStatus, 3000);
        }, 2000);

        return () => {
            console.log('🧹 Cleaning up polling...');
            isPolling = false;
            if (initialTimeout) clearTimeout(initialTimeout);
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [orderReference, isPaymentPending, paymentId]);

    // ========================================================================
    // Payment submission
    // ========================================================================
    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setIsSubmitting(true)
        setPaymentError("")

        try {
            const orderRef = generateOrderReference(tenantName)

            if (totalPrice <= transactionFee) {
                setPaymentError("Please enter a valid SMS quantity")
                setIsSubmitting(false)
                return
            }

            const result = await processPayment(
                totalPrice,
                data.mobile,
                orderRef,
                false
            )

            if (result.success && result.data) {
                console.log('✅ Payment initiated:', result.message)

                // Store payment details
                setPaymentId(result.data.id)
                setOrderReference(orderRef)

                setIsSubmitting(false)

                if (result.data.status === "PROCESSING") {
                    setIsPaymentPending(true)
                } else if (result.data.status === "SUCCESS") {
                    await handlePaymentSuccess(result.data.id, orderRef)
                } else if (result.data.status === "FAILED") {
                    handlePaymentFailure(result.data.message || "Payment failed")
                }
            } else {
                const errorMessage = result.message || "Payment initiation failed. Please try again."
                setPaymentError(errorMessage)
                console.error(errorMessage)
            }
        } catch (error) {
            console.error("Payment error:", error)
            setPaymentError("An unexpected error occurred. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    // ========================================================================
    // Handle payment Processing
    // ========================================================================
    const handlePaymentProcessing = (status: string, message: string) => {
        if (message !== "") {
            setIsPaymentProcessing(true);
        }
        const processingMessage = status || 'Payment is being processed. Please wait.'
        setProcessingMessage(processingMessage)
        console.log('Payment is Processing:', processingMessage)
    }

    // ========================================================================
    // Handle payment success
    // ========================================================================
    const handlePaymentSuccess = async (txId: string, orderRef: string) => {
        setIsPaymentPending(false)
        setIsPaymentConfirmed(true)
        setPaymentError('')
        console.log('✅ Payment successful!', { transactionId: txId, orderReference: orderRef })


        //TODO - Implement adding SMS to tenant

        // Reset after 5 seconds
        setTimeout(() => {
            setIsPaymentConfirmed(false)
            form.reset()
            setSmsQuantity(0)
            setPhoneNumber('')
            setAvailableMethods([])
            setTransactionFee(0)
            setPaymentId('')
            setOrderReference('')
            setPinTimeRemaining(90)
        }, 5000)
    }

    // ========================================================================
    // Handle payment failure
    // ========================================================================
    const handlePaymentFailure = (message: string) => {
        setIsPaymentPending(false)
        const errorMessage = message || 'Payment failed. Please try again.'
        setPaymentError(errorMessage)
        console.error('❌ Payment failed:', errorMessage)
    }

    // Map ClickPesa method names to operators
    const mapApiMethodToOperator = (apiMethodName: string) => {
        const mapping: Record<string, string> = {
            "M-PESA": "mpesa",
            "TIGO-PESA": "tigo",
            "AIRTEL-MONEY": "airtel",
            "HALOPESA": "halo",
        }
        const operatorId = mapping[apiMethodName]
        return TelcoOperators.find(op => op.id === operatorId) || null
    }

    const availableMethodsFiltered = availableMethods.filter(
        (method) => method.status === "AVAILABLE"
    )

    // Format time remaining as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="max-w-4xl mx-auto space-y-0">
            {/* Pricing Table */}
            <div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="border-b-2 border-primary">
                            <th className="text-left text-sm py-2 px-4 text-foreground font-semibold">SMS Quantity</th>
                            <th className="text-left text-sm py-2 px-4 text-foreground font-semibold">Price/SMS</th>
                        </tr>
                        </thead>
                        <tbody>
                        {PricingTiers.map((tier, index) => (
                            <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                                <td className="py-0 px-4">
                                    <div className="text-sm text-muted-foreground">
                                        {index === PricingTiers.length - 1
                                            ? `${tier.minSms.toLocaleString()}+`
                                            : index === 0
                                                ? `0 - ${(PricingTiers[1].minSms - 1).toLocaleString()}`
                                                : `${tier.minSms.toLocaleString()} - ${(PricingTiers[index + 1].minSms - 1).toLocaleString()}`
                                        }
                                    </div>
                                </td>
                                <td className="py-0 px-4">
                                    <span className="text-sm text-muted-foreground mr-1">Tshs.</span>
                                    <span className="text-sm text-foreground">{tier.price}</span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SMS Calculator */}
            <div className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2 md:col-span-1">
                        <Label htmlFor="sms-quantity" className="text-xs font-semibold text-foreground">
                            Number of SMS
                        </Label>
                        <NumberField
                            defaultValue={100}
                            min={100}
                            step={100}
                            onValueChange={(value) => setSmsQuantity(value ?? 0)}
                            disabled={isSubmitting || isPaymentConfirmed}
                        >
                            <NumberFieldGroup>
                                <NumberFieldDecrement />
                                <NumberFieldInput />
                                <NumberFieldIncrement />
                            </NumberFieldGroup>
                        </NumberField>
                    </div>
                    <div className="w-full p-3 bg-muted/50 rounded-lg md:col-span-3">
                        <span className="text-sm font-bold">Order Summary:</span>
                        <p className="text-sm text-foreground flex justify-between">
                            {thousandSeparator(smsQuantity)} SMS @ Tshs. {pricePerSms} <span className="font-semibold text-green-600">Tshs. {thousandSeparator(totalPrice)}</span>
                        </p>
                        <p className="text-sm text-foreground flex justify-between">
                            Processing Fee <span className="font-semibold text-green-600">Tshs. {thousandSeparator(transactionFee)}</span>
                        </p>
                        <hr className="my-1"/>
                        <p className="text-sm text-foreground flex justify-between">
                            Total <span className="font-semibold text-green-600">Tshs. {thousandSeparator(totalPrice + transactionFee)}</span>
                        </p>
                    </div>
                </div>
            </div>

            {smsQuantity > 0 && (
                <>
                    <div className="border-t-2 border-dashed border-border my-4"/>

                    {isPaymentConfirmed ? (
                        <div className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-500">
                            <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400 mb-4"/>
                            <h3 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">
                                Payment Confirmed!
                            </h3>
                            <p className="text-sm text-green-600 dark:text-green-400 text-center">
                                {thousandSeparator(smsQuantity)} SMS will be added to your account shortly.
                            </p>
                            {paymentId && (
                                <p className="text-xs text-green-500 mt-2">
                                    Transaction ID: {paymentId}
                                </p>
                            )}
                        </div>
                    ) : isPaymentPending ? (
                        <div className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-blue-500">
                            {/* Show countdown timer for PIN entry, spinner for processing */}
                            {isPaymentProcessing ? (
                                <Loader2 className="h-16 w-16 text-blue-600 dark:text-blue-400 mb-4 animate-spin"/>
                            ) : (
                                <div className="relative mb-4">
                                    <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                                        {formatTime(pinTimeRemaining)}
                                    </div>
                                    <div className="absolute -bottom-1 left-0 right-0 h-1 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-1000 ease-linear"
                                            style={{ width: `${(pinTimeRemaining / 90) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-2">
                                {isPaymentProcessing ? processingMessage : "Awaiting PIN Confirmation"}
                            </h3>
                            <p className="text-sm text-blue-600 dark:text-blue-400 text-center mb-2">
                                {isPaymentProcessing
                                    ? "Your transaction is being processed"
                                    : "Please check your phone and enter your PIN to complete the payment."}
                            </p>
                            {orderReference && (
                                <p className="text-xs text-blue-500 font-mono">
                                    Order: {orderReference}
                                </p>
                            )}
                        </div>
                    ) : paymentError ? (
                        <div className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-950 rounded-lg border-2 border-red-500">
                            <XCircle className="h-16 w-16 text-red-600 dark:text-red-400 mb-4"/>
                            <h3 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">
                                Payment Failed
                            </h3>
                            <p className="text-sm text-red-600 dark:text-red-400 text-center mb-4">
                                {paymentError}
                            </p>
                            <Button
                                onClick={() => {
                                    setPaymentError("")
                                    form.reset()
                                    setPhoneNumber("")
                                    setOrderReference("")
                                    setPaymentId("")
                                    setPinTimeRemaining(90)
                                }}
                                className="mt-2"
                                variant="outline"
                            >
                                Try Again
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Display Available Payment Methods */}
                            {availableMethodsFiltered.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-sm font-semibold text-foreground pb-2">
                                        Available Payment Methods
                                    </h3>
                                    <div className="flex gap-3 flex-wrap">
                                        {availableMethodsFiltered.map((method) => {
                                            const operator = mapApiMethodToOperator(method.name)
                                            if (!operator) return null

                                            return (
                                                <div key={method.name} className="flex items-center">
                                                    <Image
                                                        src={operator.icon}
                                                        alt={operator.name}
                                                        width={130}
                                                        height={30}
                                                        className="rounded-lg"
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {isLoadingMethods && availableMethodsFiltered.length === 0 && (
                                <div className="mb-4 text-sm text-muted-foreground">
                                    Loading payment methods...
                                </div>
                            )}

                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <Controller
                                    name="mobile"
                                    control={form.control}
                                    render={({field, fieldState}) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor="mobile">
                                                Enter your mobile money number
                                            </FieldLabel>
                                            <PhoneInput
                                                {...field}
                                                id="mobile"
                                                aria-invalid={fieldState.invalid}
                                                type="tel"
                                                placeholder="Enter your phone number e.g 255712000111"
                                                className="h-10 w-full text-base"
                                                disabled={isSubmitting}
                                                onChange={(value) => {
                                                    field.onChange(value)
                                                    setPhoneNumber(value)
                                                }}
                                            />
                                        </Field>
                                    )}
                                />

                                {/* Submit Button */}
                                {phoneNumber && (
                                    <Button
                                        className="w-full cursor-pointer dark:bg-orange-600 bg-orange-500 mt-4"
                                        type="submit"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                Initializing Payment
                                            </>
                                        ) : (
                                            "Pay Now"
                                        )}
                                    </Button>
                                )}
                            </form>
                        </>
                    )}
                </>
            )}
        </div>
    )
}

// Optional: Helper function to generate unique order reference
export function generateOrderReference(tenant: string | undefined): string {
    const timestamp = Date.now()
    const cleanTenant = tenant
            ?.trim()
            .split(" ")[0]                  // Take first word before first space
            .toUpperCase()                   // Capitalize
            .replace(/[^A-Z0-9]/g, "")      // Remove non-alphanumeric
        || "ANONYMOUS"
    return `${cleanTenant}${timestamp}`
}