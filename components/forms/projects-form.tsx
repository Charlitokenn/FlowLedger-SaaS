"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import InputField from './fields/input-field';

// Zod validation schemas for each step
const personalInfoSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
});

const planSchema = z.object({
    plan: z.enum(['arcade', 'advanced', 'pro']),
    billing: z.enum(['monthly', 'yearly']),
});

const addOnsSchema = z.object({
    onlineService: z.boolean(),
    largerStorage: z.boolean(),
    customProfile: z.boolean(),
});

// Combined schema for final validation
const formSchema = z.object({
    ...personalInfoSchema.shape,
    ...planSchema.shape,
    ...addOnsSchema.shape,
});

type FormData = z.infer<typeof formSchema>;

// Step configuration
const steps = [
    { id: 1, name: 'Personal Info', description: 'Please provide your name, email address, and phone number.' },
    { id: 2, name: 'Select Plan', description: 'You have the option of monthly or yearly billing.' },
    { id: 3, name: 'Add-ons', description: 'Add-ons help enhance your gaming experience.' },
    { id: 4, name: 'Summary', description: 'Double-check everything looks OK before confirming.' },
];

const plans = [
    { id: 'arcade', name: 'Arcade', monthlyPrice: 9, yearlyPrice: 90, icon: '🎮' },
    { id: 'advanced', name: 'Advanced', monthlyPrice: 12, yearlyPrice: 120, icon: '🎯' },
    { id: 'pro', name: 'Pro', monthlyPrice: 15, yearlyPrice: 150, icon: '👑' },
];

const addOns = [
    { id: 'onlineService', name: 'Online service', description: 'Access to multiplayer games', monthlyPrice: 1, yearlyPrice: 10 },
    { id: 'largerStorage', name: 'Larger storage', description: 'Extra 1TB of cloud save', monthlyPrice: 2, yearlyPrice: 20 },
    { id: 'customProfile', name: 'Customizable profile', description: 'Custom theme on your profile', monthlyPrice: 2, yearlyPrice: 20 },
];

export default function MultiStepForm() {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<Partial<FormData>>({
        name: '',
        email: '',
        phone: '',
        plan: undefined,
        billing: 'monthly',
        onlineService: false,
        largerStorage: false,
        customProfile: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const validateStep = (step: number): boolean => {
        setErrors({});

        try {
            if (step === 1) {
                personalInfoSchema.parse({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                });
            } else if (step === 2) {
                planSchema.parse({
                    plan: formData.plan,
                    billing: formData.billing,
                });
            } else if (step === 3) {
                addOnsSchema.parse({
                    onlineService: formData.onlineService,
                    largerStorage: formData.largerStorage,
                    customProfile: formData.customProfile,
                });
            }
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                error.issues.forEach((err) => {
                    if (err.path[0]) {
                        newErrors[err.path[0] as string] = err.message;
                    }
                });
                setErrors(newErrors);
            }
            return false;
        }
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, steps.length));
        }
    };

    const handleBack = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    const handleSubmit = () => {
        if (validateStep(currentStep)) {
            try {
                formSchema.parse(formData);
                setIsSubmitted(true);
                console.log('Form submitted:', formData);
            } catch (error) {
                console.error('Final validation failed:', error);
            }
        }
    };

    const updateFormData = (field: keyof FormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Lightweight "register" helper so we can reuse the shared InputField
    const register = (fieldName: string, _validation?: any) => ({
        name: fieldName,
        value: formData[fieldName as keyof FormData] ?? "",
        onChange: (e: any) => updateFormData(fieldName as keyof FormData, e.target.value),
    });

    const calculateTotal = () => {
        if (!formData.plan) return 0;

        const selectedPlan = plans.find((p) => p.id === formData.plan);
        const isYearly = formData.billing === 'yearly';
        const planPrice = isYearly ? selectedPlan?.yearlyPrice || 0 : selectedPlan?.monthlyPrice || 0;

        let total = planPrice;

        addOns.forEach((addon) => {
            const addonKey = addon.id as keyof FormData;
            if (formData[addonKey]) {
                total += isYearly ? addon.yearlyPrice : addon.monthlyPrice;
            }
        });

        return total;
    };

    if (isSubmitted) {
        return (
            <div className="p-4 flex justify-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-card text-card-foreground border border-border rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Thank you!</h2>
                    <p className="text-muted-foreground mb-6">
                        Thanks for confirming your subscription! We hope you have fun using our platform. If you ever need
                        support, please feel free to email us at support@loremgaming.com.
                    </p>
                    <button
                        onClick={() => {
                            setIsSubmitted(false);
                            setCurrentStep(1);
                            setFormData({
                                name: '',
                                email: '',
                                phone: '',
                                plan: undefined,
                                billing: 'monthly',
                                onlineService: false,
                                largerStorage: false,
                                customProfile: false,
                            });
                        }}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors"
                    >
                        Start Over
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="p-1">
            <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden max-w-full w-full flex flex-col md:flex-row">
                {/* Sidebar */}
                <div className="bg-primary text-primary-foreground p-8 md:w-1/4">
                    <div className="space-y-6">
                        {steps.map((step) => (
                            <div key={step.id} className="flex items-center space-x-4">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${currentStep === step.id
                                        ? 'bg-primary-foreground text-primary'
                                        : currentStep > step.id
                                            ? 'bg-primary/70 text-primary-foreground'
                                            : 'border-2 border-primary-foreground text-primary-foreground'
                                        }`}
                                >
                                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-primary-foreground/70 text-xs uppercase">Step {step.id}</p>
                                    <p className="font-semibold">{step.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8 md:p-12 flex flex-col bg-background">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex-1"
                        >
                            <h2 className="text-3xl font-bold mb-2">{steps[currentStep - 1].name}</h2>
                            <p className="text-muted-foreground mb-8">{steps[currentStep - 1].description}</p>

                            {/* Step 1: Personal Info */}
                            {currentStep === 1 && (
                                <div className="space-y-5">
                                    <InputField
                                        name="name"
                                        label="Name"
                                        placeholder="e.g. Stephen King"
                                        type="text"
                                        register={register}
                                        error={errors.name ? { message: errors.name } as any : undefined}
                                    />

                                    <InputField
                                        name="email"
                                        label="Email Address"
                                        placeholder="e.g. stephenking@lorem.com"
                                        type="email"
                                        register={register}
                                        error={errors.email ? { message: errors.email } as any : undefined}
                                    />

                                    <InputField
                                        name="phone"
                                        label="Phone Number"
                                        placeholder="e.g. +1 234 567 890"
                                        type="tel"
                                        register={register}
                                        error={errors.phone ? { message: errors.phone } as any : undefined}
                                    />
                                </div>
                            )}

                            {/* Step 2: Select Plan */}
                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {plans.map((plan) => (
                                            <button
                                                key={plan.id}
                                                onClick={() => updateFormData('plan', plan.id)}
                                                className={`p-4 border-2 rounded-xl text-left transition-all hover:border-primary ${formData.plan === plan.id ? 'border-primary bg-accent' : 'border-border'
                                                    }`}
                                            >
                                                <div className="text-3xl mb-3">{plan.icon}</div>
                                                <h3 className="font-bold">{plan.name}</h3>
                                                <p className="text-muted-foreground text-sm">
                                                    ${formData.billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}/
                                                    {formData.billing === 'monthly' ? 'mo' : 'yr'}
                                                </p>
                                                {formData.billing === 'yearly' && (
                                                    <p className="text-primary text-xs mt-1">2 months free</p>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    {errors.plan && <p className="text-destructive text-sm">{errors.plan}</p>}

                                    <div className="flex items-center justify-center space-x-4 bg-muted rounded-lg p-4">
                                        <span
                                            className={`font-medium ${formData.billing === 'monthly' ? 'text-foreground' : 'text-muted-foreground'
                                                }`}
                                        >
                                            Monthly
                                        </span>
                                        <button
                                            onClick={() => updateFormData('billing', formData.billing === 'monthly' ? 'yearly' : 'monthly')}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${formData.billing === 'yearly' ? 'bg-primary' : 'bg-muted'
                                                }`}
                                        >
                                            <motion.div
                                                className="absolute top-1 w-4 h-4 bg-white rounded-full"
                                                animate={{ left: formData.billing === 'yearly' ? '28px' : '4px' }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            />
                                        </button>
                                        <span
                                            className={`font-medium ${formData.billing === 'yearly' ? 'text-foreground' : 'text-muted-foreground'
                                                }`}
                                        >
                                            Yearly
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Add-ons */}
                            {currentStep === 3 && (
                                <div className="space-y-4">
                                    {addOns.map((addon) => {
                                        const addonKey = addon.id as keyof FormData;
                                        return (
                                            <label
                                                key={addon.id}
                                                className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-primary ${formData[addonKey] ? 'border-primary bg-accent' : 'border-border'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData[addonKey] as boolean}
                                                    onChange={(e) => updateFormData(addonKey, e.target.checked)}
                                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                                <div className="ml-4 flex-1">
                                                    <h3 className="font-bold">{addon.name}</h3>
                                                    <p className="text-muted-foreground text-sm">{addon.description}</p>
                                                </div>
                                                <span className="text-primary font-medium">
                                                    +${formData.billing === 'monthly' ? addon.monthlyPrice : addon.yearlyPrice}/
                                                    {formData.billing === 'monthly' ? 'mo' : 'yr'}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Step 4: Summary */}
                            {currentStep === 4 && (
                                <div className="space-y-6">
                                    <div className="bg-muted rounded-xl p-6">
                                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                                            <div>
                                                <h3 className="font-bold">
                                                    {plans.find((p) => p.id === formData.plan)?.name} ({formData.billing === 'monthly' ? 'Monthly' : 'Yearly'})
                                                </h3>
                                                <button
                                                    onClick={() => setCurrentStep(2)}
                                                    className="text-primary text-sm underline hover:opacity-90"
                                                >
                                                    Change
                                                </button>
                                            </div>
                                            <span className="font-bold">
                                                ${formData.billing === 'monthly'
                                                    ? plans.find((p) => p.id === formData.plan)?.monthlyPrice
                                                    : plans.find((p) => p.id === formData.plan)?.yearlyPrice}
                                                /{formData.billing === 'monthly' ? 'mo' : 'yr'}
                                            </span>
                                        </div>

                                        {addOns.map((addon) => {
                                            const addonKey = addon.id as keyof FormData;
                                            if (!formData[addonKey]) return null;
                                            return (
                                                <div key={addon.id} className="flex items-center justify-between py-3">
                                                    <span className="text-muted-foreground">{addon.name}</span>
                                                    <span className="text-foreground">
                                                        +${formData.billing === 'monthly' ? addon.monthlyPrice : addon.yearlyPrice}/
                                                        {formData.billing === 'monthly' ? 'mo' : 'yr'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex items-center justify-between px-6">
                                        <span className="text-muted-foreground">Total (per {formData.billing === 'monthly' ? 'month' : 'year'})</span>
                                        <span className="text-2xl font-bold text-primary">
                                            +${calculateTotal()}/{formData.billing === 'monthly' ? 'mo' : 'yr'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                        {currentStep > 1 ? (
                            <button
                                onClick={handleBack}
                                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                <span>Go Back</span>
                            </button>
                        ) : (
                            <div />
                        )}

                        {currentStep < steps.length ? (
                            <Button
                                onClick={handleNext}
                                className="flex items-center space-x-2 px-6 py-3 rounded-lg cursor-pointer transition-colors ml-auto"
                            >
                                <span>Next Step</span>
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                className="px-6 py-3 rounded-lg ml-auto"
                            >
                                Confirm
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}