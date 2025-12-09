"use client"

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

// ============================================================================
// Type Definitions
// ============================================================================

export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "tel" | "url";
  placeholder?: string;
  description?: string;
}

export interface FormStep<TSchema extends z.ZodType = z.ZodType> {
  id: string;
  title: string;
  description?: string;
  schema: TSchema;
  fields: FormField[];
}

export interface MultiStepFormConfig<TData = Record<string, any>> {
  steps: FormStep[];
  onSubmit: (data: TData) => void | Promise<void>;
  onStepChange?: (step: number, data: Partial<TData>) => void;
  className?: string;
  submitButtonText?: string;
  submittingButtonText?: string;
  successTitle?: string;
  successMessage?: string;
  showStepLabels?: boolean;
  allowNavigateBack?: boolean;
}

// ============================================================================
// Utility Components
// ============================================================================

const cn = (...classes: (string | boolean | undefined)[]) => 
  classes.filter(Boolean).join(" ");

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
}> = ({ className, variant = "default", children, ...props }) => (
  <button
    className={cn(
      "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
      variant === "default" && "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
      variant === "outline" && "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
      className
    )}
    {...props}
  >
    {children}
  </button>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ 
  className, 
  ...props 
}) => (
  <input
    className={cn(
      "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
      className
    )}
    {...props}
  />
);

const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ 
  className, 
  children, 
  ...props 
}) => (
  <label
    className={cn("block text-sm font-medium text-gray-700 mb-1", className)}
    {...props}
  >
    {children}
  </label>
);

const Progress: React.FC<{ value: number; className?: string }> = ({ 
  value, 
  className 
}) => (
  <div className={cn("w-full bg-gray-200 rounded-full overflow-hidden", className)}>
    <div
      className="h-full bg-blue-600 transition-all duration-300 ease-out"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export function MultiStepForm<TData extends Record<string, any> = Record<string, any>>({
  steps,
  onSubmit,
  onStepChange,
  className,
  submitButtonText = "Submit",
  submittingButtonText = "Submitting...",
  successTitle = "Form Submitted!",
  successMessage = "Thank you for completing the form. We'll be in touch soon.",
  showStepLabels = true,
  allowNavigateBack = true,
}: MultiStepFormConfig<TData>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<TData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const currentStepConfig = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(currentStepConfig.schema),
    defaultValues: formData,
    mode: "onBlur",
  });

  const handleNextStep = useCallback(async (stepData: any) => {
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);

    if (onStepChange) {
      onStepChange(currentStep, updatedData);
    }

    if (!isLastStep) {
      setCurrentStep(prev => prev + 1);
      reset(updatedData);
    } else {
      setIsSubmitting(true);
      try {
        await onSubmit(updatedData as TData);
        setIsComplete(true);
      } catch (error) {
        console.error("Form submission error:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [currentStep, formData, isLastStep, onSubmit, onStepChange, reset]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 0 && allowNavigateBack) {
      setCurrentStep(prev => prev - 1);
      reset(formData);
    }
  }, [currentStep, formData, reset, allowNavigateBack]);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setFormData({});
    setIsComplete(false);
    reset({});
  }, [reset]);

  const animationVariants = useMemo(() => ({
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  }), []);

  if (isComplete) {
    return (
      <div className={cn("w-full max-w-md mx-auto p-6 rounded-lg shadow-lg bg-white", className)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-10"
        >
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 mb-4">
            <CheckCircle2 className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">{successTitle}</h2>
          <p className="text-gray-600 mb-6">{successMessage}</p>
          <Button onClick={handleReset}>Start Over</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-md mx-auto p-6 rounded-lg shadow-lg bg-white", className)}>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                index < currentStep
                  ? "bg-blue-600 text-white"
                  : index === currentStep
                  ? "bg-blue-600 text-white ring-4 ring-blue-100"
                  : "bg-gray-200 text-gray-600"
              )}
            >
              {index < currentStep ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </div>
            {showStepLabels && (
              <span className="text-xs mt-1 text-gray-600 text-center hidden sm:block max-w-[80px] truncate">
                {step.title}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={animationVariants}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">{currentStepConfig.title}</h2>
            {currentStepConfig.description && (
              <p className="text-sm text-gray-600 mt-1">{currentStepConfig.description}</p>
            )}
          </div>

          <div className="space-y-4">
            {currentStepConfig.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  {...register(field.name)}
                  className={cn(
                    errors[field.name] && "border-red-500 focus:ring-red-500"
                  )}
                  aria-invalid={errors[field.name] ? "true" : "false"}
                  aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                />
                {field.description && !errors[field.name] && (
                  <p className="text-xs text-gray-500">{field.description}</p>
                )}
                {errors[field.name] && (
                  <p id={`${field.name}-error`} className="text-sm text-red-600" role="alert">
                    {errors[field.name]?.message as string}
                  </p>
                )}
              </div>
            ))}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 0 || !allowNavigateBack}
                className={cn((currentStep === 0 || !allowNavigateBack) && "invisible")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button 
                type="button"
                onClick={handleSubmit(handleNextStep)} 
                disabled={isSubmitting}
              >
                {isLastStep ? (
                  isSubmitting ? submittingButtonText : submitButtonText
                ) : (
                  <>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Example Usage
// ============================================================================

const personalInfoSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

const addressSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  zipCode: z.string().min(5, "Zip code must be at least 5 characters"),
});

const accountSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const exampleSteps: FormStep[] = [
  {
    id: "personal",
    title: "Personal Info",
    description: "Tell us about yourself",
    schema: personalInfoSchema,
    fields: [
      { name: "firstName", label: "First Name", type: "text", placeholder: "John" },
      { name: "lastName", label: "Last Name", type: "text", placeholder: "Doe" },
      { name: "email", label: "Email", type: "email", placeholder: "john.doe@example.com" },
    ],
  },
  {
    id: "address",
    title: "Address",
    description: "Where do you live?",
    schema: addressSchema,
    fields: [
      { name: "address", label: "Address", type: "text", placeholder: "123 Main St" },
      { name: "city", label: "City", type: "text", placeholder: "New York" },
      { name: "zipCode", label: "Zip Code", type: "text", placeholder: "10001" },
    ],
  },
  {
    id: "account",
    title: "Account Setup",
    description: "Create your account",
    schema: accountSchema,
    fields: [
      { name: "username", label: "Username", type: "text", placeholder: "johndoe" },
      { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
      { name: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "••••••••" },
    ],
  },
];

export default function App() {
  const handleSubmit = async (data: any) => {
    console.log("Form submitted:", data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
  };

  const handleStepChange = (step: number, data: any) => {
    console.log(`Step ${step + 1} completed:`, data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <MultiStepForm
        steps={exampleSteps}
        onSubmit={handleSubmit}
        onStepChange={handleStepChange}
        showStepLabels={true}
        allowNavigateBack={true}
      />
    </div>
  );
}