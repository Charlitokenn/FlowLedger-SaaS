"use server"

import { z } from "zod"
import crypto from "crypto"

// Token cache
let tokenCache: {
    token: string | null
    expiresAt: number | null
} = {
    token: null,
    expiresAt: null,
}

// Response types
type TokenResponse = {
    success: boolean
    token?: string
    error?: string
}

type PreviewResponse = {
    success: boolean
    message: string
    data?: {
        activeMethods: Array<{
            name: string
            status: "AVAILABLE" | "UNAVAILABLE"
            fee?: number
            message?: string
        }>
        sender?: {
            accountName: string
            accountNumber: string
            accountProvider: string
        }
    }
    error?: string
}

type InitiateResponse = {
    success: boolean
    message: string
    data?: {
        id: string
        status: "PROCESSING" | "SUCCESS" | "FAILED" | "SETTLED"
        message: string
        channel: string
        orderReference: string
        collectedAmount: string
        collectedCurrency: string
        createdAt: string
        clientId: string
    }
    error?: string
}

type QueryResponse = {
    success: boolean
    message: string
    data?: any
    error?: string
}

const baseUrl = process.env.CLICKPESA_BASE_URL

// Validation schema
const paymentSchema = z.object({
    amount: z.number().positive("Amount must be positive"),
    phoneNumber: z.string(),
    orderReference: z.string().min(1, "Order reference is required"),
})

// Canonicalize function - recursively sort object keys
function canonicalize(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) {
        return obj.map(canonicalize)
    }
    return Object.keys(obj)
        .sort()
        .reduce((acc, key) => {
            acc[key] = canonicalize(obj[key])
            return acc
        }, {} as any)
}

// Generate checksum per official ClickPesa documentation
function createPayloadChecksum(checksumKey: string, payload: Record<string, any>): string {
    // Canonicalize the payload recursively for consistent ordering
    const canonicalPayload = canonicalize(payload)

    // Serialize the canonical payload to JSON string (compact, no whitespace)
    const payloadString = JSON.stringify(canonicalPayload)

    console.log("Checksum - Canonical payload:", canonicalPayload)
    console.log("Checksum - JSON string:", payloadString)

    // Create HMAC with SHA256
    const hmac = crypto.createHmac("sha256", checksumKey)
    hmac.update(payloadString)
    const checksum = hmac.digest("hex")

    console.log("Checksum - Generated hash:", checksum)

    return checksum
}

// Generate Authorization Token
async function generateAuthToken(): Promise<TokenResponse> {
    try {
        const clientId = process.env.CLICKPESA_CLIENT_ID
        const apiKey = process.env.CLICKPESA_API_KEY

        if (!clientId || !apiKey) {
            throw new Error("ClickPesa credentials not configured")
        }

        const response = await fetch(
            "https://api.clickpesa.com/third-parties/generate-token",
            {
                method: "POST",
                headers: {
                    "client-id": clientId,
                    "api-key": apiKey,
                },
                signal: AbortSignal.timeout(15000),
            }
        )

        const data = await response.json()

        if (!response.ok || !data.success) {
            console.error("Token generation failed:", data)
            return {
                success: false,
                error: data.message || "Failed to generate token",
            }
        }

        const expiresAt = Date.now() + (55 * 60 * 1000)

        tokenCache = {
            token: data.token,
            expiresAt: expiresAt,
        }

        return {
            success: true,
            token: data.token,
        }
    } catch (error) {
        console.error("Generate token error:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

// Get valid token
async function getValidToken(): Promise<string> {
    const now = Date.now()

    if (tokenCache.token && tokenCache.expiresAt && tokenCache.expiresAt > now) {
        return tokenCache.token
    }

    const tokenResult = await generateAuthToken()

    if (!tokenResult.success || !tokenResult.token) {
        throw new Error("Failed to obtain authorization token")
    }

    return tokenResult.token
}

// Step 1: Preview USSD-PUSH Request
export async function previewUssdPushRequest(
    amount: number,
    phoneNumber: string,
    orderReference: string,
    fetchSenderDetails: boolean = false
): Promise<PreviewResponse> {
    try {
        const validatedData = paymentSchema.parse({
            amount,
            phoneNumber,
            orderReference,
        })

        const token = await getValidToken()
        const checksumKey = process.env.CLICKPESA_CHECKSUM_KEY

        // Build payload (exclude checksum and checksumMethod)
        const payload: Record<string, any> = {
            amount: validatedData.amount.toString(),
            currency: "TZS",
            fetchSenderDetails: fetchSenderDetails,
            orderReference: validatedData.orderReference,
            phoneNumber: validatedData.phoneNumber,
        }

        console.log("Preview - Payload before checksum:", payload)

        // Generate and add checksum
        if (checksumKey) {
            const checksum = createPayloadChecksum(checksumKey, payload)
            payload.checksum = checksum
        }

        console.log("Preview - Final payload:", payload)

        const response = await fetch(
            "https://api.clickpesa.com/third-parties/payments/preview-ussd-push-request",
            {
                method: "POST",
                headers: {
                    Authorization: token,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(15000),
            }
        )

        const data = await response.json()

        if (!response.ok) {
            console.error("Preview validation error:", data)
            return {
                success: false,
                message: data.message || "Payment validation failed",
                error: data.error || `HTTP ${response.status}`,
            }
        }

        const availableMethods = data.activeMethods?.filter(
            (method: any) => method.status === "AVAILABLE"
        )
console.log({availableMethods})
        if (!availableMethods || availableMethods.length === 0) {
            return {
                success: false,
                message: "No payment methods available for this phone number",
                error: "Payment methods unavailable",
            }
        }

        return {
            success: true,
            message: "Payment details validated successfully",
            data: {
                activeMethods: data.activeMethods,
                sender: data.sender,
            },
        }
    } catch (error) {
        console.error("Preview USSD-PUSH error:", error)

        if (error instanceof z.ZodError) {
            return {
                success: false,
                message: "Validation error",
                error: error.errors[0].message,
            }
        }

        if (error instanceof TypeError || error.name === "AbortError") {
            return {
                success: false,
                message: "Network error or timeout",
                error: "Please check your connection and try again",
            }
        }

        return {
            success: false,
            message: "Failed to validate payment details",
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

// Step 2: Initiate USSD-PUSH Request
export async function initiateUssdPushRequest(
    amount: number,
    phoneNumber: string,
    orderReference: string
): Promise<InitiateResponse> {
    try {
        const validatedData = paymentSchema.parse({
            amount,
            phoneNumber,
            orderReference,
        })

        const token = await getValidToken()
        const checksumKey = process.env.CLICKPESA_CHECKSUM_KEY

        // Build payload
        const payload: Record<string, string> = {
            amount: validatedData.amount.toString(),
            currency: "TZS",
            orderReference: validatedData.orderReference,
            phoneNumber: validatedData.phoneNumber,
        }

        console.log("Initiate - Payload before checksum:", payload)

        // Generate and add checksum
        if (checksumKey) {
            const checksum = createPayloadChecksum(checksumKey, payload)
            payload.checksum = checksum
        }

        console.log("Initiate - Final payload:", payload)

        const response = await fetch(
            `${baseUrl}/payments/initiate-ussd-push-request`,
            {
                method: "POST",
                headers: {
                    Authorization: token,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(30000),
            }
        )

        const data = await response.json()

        if (!response.ok) {
            console.error("ClickPesa API error:", data)
            return {
                success: false,
                message: data.message || "Payment initiation failed",
                error: data.error || `HTTP ${response.status}`,
            }
        }

        return {
            success: true,
            message: "Payment request sent. Please check your phone to confirm.",
            data: {
                id: data.id,
                status: data.status,
                message: data.message,
                channel: data.channel,
                orderReference: data.orderReference,
                collectedAmount: data.collectedAmount,
                collectedCurrency: data.collectedCurrency,
                createdAt: data.createdAt,
                clientId: data.clientId,
            },
        }
    } catch (error) {
        console.error("Initiate USSD-PUSH error:", error)

        if (error instanceof z.ZodError) {
            return {
                success: false,
                message: "Validation error",
                error: error.errors[0].message,
            }
        }

        if (error instanceof TypeError || error.name === "AbortError") {
            return {
                success: false,
                message: "Network error or timeout",
                error: "Please check your connection and try again",
            }
        }

        return {
            success: false,
            message: "An unexpected error occurred",
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

// Step 3: Query Payment Status
export async function queryPaymentStatus(
    orderReference: string
): Promise<QueryResponse> {
    try {
        const token = await getValidToken()

        const response = await fetch(
            `${baseUrl}/payments/${orderReference}`,
            {
                method: "GET",
                headers: {
                    Authorization: token,
                },
                signal: AbortSignal.timeout(15000),
            }
        )

        const data = await response.json()
        console.log(data)
        if (!response.ok) {
            return {
                success: false,
                message: "Failed to query payment status",
                error: data.error || `HTTP ${response.status}`,
            }
        }

        return {
            success: true,
            message: "Payment status retrieved",
            data: data,
        }
    } catch (error) {
        console.error("Query payment status error:", error)
        return {
            success: false,
            message: "Failed to query payment status",
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

// Complete payment flow
export async function processPayment(
    amount: number,
    phoneNumber: string,
    orderReference: string,
    fetchSenderDetails: boolean = false
): Promise<InitiateResponse> {
    const previewResult = await previewUssdPushRequest(
        amount,
        phoneNumber,
        orderReference,
        fetchSenderDetails
    )

    if (!previewResult.success) {
        return {
            success: false,
            message: previewResult.message,
            error: previewResult.error,
        }
    }

    const initiateResult = await initiateUssdPushRequest(
        amount,
        phoneNumber,
        orderReference
    )

    return initiateResult
}

// Helper function
// export function generateOrderReference(prefix: string = "SMS"): string {
//     const timestamp = Date.now()
//     const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
//     return `${prefix}-${timestamp}-${random}`
// }