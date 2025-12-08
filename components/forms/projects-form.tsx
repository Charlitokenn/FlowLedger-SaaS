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
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank you!</h2>
                    <p className="text-gray-600 mb-6">
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
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Start Over
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-1">
            <div className="bg-white rounded-xl border-2 shadow-none overflow-hidden max-w-full w-full flex flex-col md:flex-row">
                {/* Sidebar */}
                <div className="bg-primary p-8 md:w-1/4">
                    <div className="space-y-6">
                        {steps.map((step) => (
                            <div key={step.id} className="flex items-center space-x-4">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${currentStep === step.id
                                        ? 'bg-white text-indigo-600'
                                        : currentStep > step.id
                                            ? 'bg-indigo-300 text-white'
                                            : 'border-2 border-white text-white'
                                        }`}
                                >
                                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-indigo-200 text-xs uppercase">Step {step.id}</p>
                                    <p className="text-white font-semibold">{step.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8 md:p-12 flex flex-col">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex-1"
                        >
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">{steps[currentStep - 1].name}</h2>
                            <p className="text-gray-500 mb-8">{steps[currentStep - 1].description}</p>

                            {/* Step 1: Personal Info */}
                            {currentStep === 1 && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => updateFormData('name', e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${errors.name ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="e.g. Stephen King"
                                        />
                                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => updateFormData('email', e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${errors.email ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="e.g. stephenking@lorem.com"
                                        />
                                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => updateFormData('phone', e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${errors.phone ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="e.g. +1 234 567 890"
                                        />
                                        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                                    </div>
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
                                                className={`p-4 border-2 rounded-xl text-left transition-all hover:border-indigo-500 ${formData.plan === plan.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                                                    }`}
                                            >
                                                <div className="text-3xl mb-3">{plan.icon}</div>
                                                <h3 className="font-bold text-gray-800">{plan.name}</h3>
                                                <p className="text-gray-600 text-sm">
                                                    ${formData.billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}/
                                                    {formData.billing === 'monthly' ? 'mo' : 'yr'}
                                                </p>
                                                {formData.billing === 'yearly' && (
                                                    <p className="text-indigo-600 text-xs mt-1">2 months free</p>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    {errors.plan && <p className="text-red-500 text-sm">{errors.plan}</p>}

                                    <div className="flex items-center justify-center space-x-4 bg-gray-50 rounded-lg p-4">
                                        <span
                                            className={`font-medium ${formData.billing === 'monthly' ? 'text-gray-800' : 'text-gray-400'
                                                }`}
                                        >
                                            Monthly
                                        </span>
                                        <button
                                            onClick={() => updateFormData('billing', formData.billing === 'monthly' ? 'yearly' : 'monthly')}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${formData.billing === 'yearly' ? 'bg-indigo-600' : 'bg-gray-300'
                                                }`}
                                        >
                                            <motion.div
                                                className="absolute top-1 w-4 h-4 bg-white rounded-full"
                                                animate={{ left: formData.billing === 'yearly' ? '28px' : '4px' }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            />
                                        </button>
                                        <span
                                            className={`font-medium ${formData.billing === 'yearly' ? 'text-gray-800' : 'text-gray-400'
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
                                                className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-indigo-500 ${formData[addonKey] ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData[addonKey] as boolean}
                                                    onChange={(e) => updateFormData(addonKey, e.target.checked)}
                                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                                <div className="ml-4 flex-1">
                                                    <h3 className="font-bold text-gray-800">{addon.name}</h3>
                                                    <p className="text-gray-500 text-sm">{addon.description}</p>
                                                </div>
                                                <span className="text-indigo-600 font-medium">
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
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                                            <div>
                                                <h3 className="font-bold text-gray-800">
                                                    {plans.find((p) => p.id === formData.plan)?.name} ({formData.billing === 'monthly' ? 'Monthly' : 'Yearly'})
                                                </h3>
                                                <button
                                                    onClick={() => setCurrentStep(2)}
                                                    className="text-indigo-600 text-sm underline hover:text-indigo-700"
                                                >
                                                    Change
                                                </button>
                                            </div>
                                            <span className="font-bold text-gray-800">
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
                                                    <span className="text-gray-600">{addon.name}</span>
                                                    <span className="text-gray-800">
                                                        +${formData.billing === 'monthly' ? addon.monthlyPrice : addon.yearlyPrice}/
                                                        {formData.billing === 'monthly' ? 'mo' : 'yr'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex items-center justify-between px-6">
                                        <span className="text-gray-600">Total (per {formData.billing === 'monthly' ? 'month' : 'year'})</span>
                                        <span className="text-2xl font-bold text-indigo-600">
                                            +${calculateTotal()}/{formData.billing === 'monthly' ? 'mo' : 'yr'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                        {currentStep > 1 ? (
                            <button
                                onClick={handleBack}
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
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
                                className="flex items-center space-x-2 bg-primary px-6 py-3 rounded-lg cursor-pointer transition-colors ml-auto"
                            >
                                <span>Next Step</span>
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                className="bg-primary px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors ml-auto"
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