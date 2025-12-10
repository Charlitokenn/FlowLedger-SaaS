"use client"

import React, { useState, useCallback, useMemo, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "../ui/button";

// ============================================================================
// Stepper Components
// ============================================================================

type StepperContextValue = {
  activeStep: number;
  setActiveStep: (step: number) => void;
  orientation: "horizontal" | "vertical";
};

type StepItemContextValue = {
  step: number;
  state: StepState;
  isDisabled: boolean;
  isLoading: boolean;
};

type StepState = "active" | "completed" | "inactive" | "loading";

const StepperContext = createContext<StepperContextValue | undefined>(undefined);
const StepItemContext = createContext<StepItemContextValue | undefined>(undefined);

const useStepper = () => {
  const context = useContext(StepperContext);
  if (!context) {
    throw new Error("useStepper must be used within a Stepper");
  }
  return context;
};

const useStepItem = () => {
  const context = useContext(StepItemContext);
  if (!context) {
    throw new Error("useStepItem must be used within a StepperItem");
  }
  return context;
};

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  orientation?: "horizontal" | "vertical";
}

function Stepper({
  defaultValue = 0,
  value,
  onValueChange,
  orientation = "horizontal",
  className,
  ...props
}: StepperProps) {
  const [activeStep, setInternalStep] = React.useState(defaultValue);

  const setActiveStep = React.useCallback(
    (step: number) => {
      if (value === undefined) {
        setInternalStep(step);
      }
      onValueChange?.(step);
    },
    [value, onValueChange],
  );

  const currentStep = value ?? activeStep;

  return (
    <StepperContext.Provider
      value={{
        activeStep: currentStep,
        orientation,
        setActiveStep,
      }}
    >
      <div
        className={cn(
          "group/stepper inline-flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col",
          className,
        )}
        data-orientation={orientation}
        data-slot="stepper"
        {...props}
      />
    </StepperContext.Provider>
  );
}

interface StepperItemProps extends React.HTMLAttributes<HTMLDivElement> {
  step: number;
  completed?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

function StepperItem({
  step,
  completed = false,
  disabled = false,
  loading = false,
  className,
  children,
  ...props
}: StepperItemProps) {
  const { activeStep } = useStepper();

  const state: StepState =
    completed || step < activeStep
      ? "completed"
      : activeStep === step
        ? "active"
        : "inactive";

  const isLoading = loading && step === activeStep;

  return (
    <StepItemContext.Provider
      value={{ isDisabled: disabled, isLoading, state, step }}
    >
      <div
        className={cn(
          "group/step flex items-center group-data-[orientation=horizontal]/stepper:flex-row group-data-[orientation=vertical]/stepper:flex-col",
          className,
        )}
        data-slot="stepper-item"
        data-state={state}
        {...(isLoading ? { "data-loading": true } : {})}
        {...props}
      >
        {children}
      </div>
    </StepItemContext.Provider>
  );
}

interface StepperTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

function StepperTrigger({
  asChild = false,
  className,
  children,
  ...props
}: StepperTriggerProps) {
  const { setActiveStep } = useStepper();
  const { step, isDisabled } = useStepItem();

  return (
    <button
      className={cn(
        "inline-flex items-center gap-3 rounded-full outline-none focus-visible:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      data-slot="stepper-trigger"
      disabled={isDisabled}
      onClick={() => setActiveStep(step)}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

interface StepperIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

function StepperIndicator({
  asChild = false,
  className,
  children,
  ...props
}: StepperIndicatorProps) {
  const { state, step, isLoading } = useStepItem();

  return (
    <span
      className={cn(
        "relative flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-200 font-medium text-gray-600 text-xs data-[state=active]:bg-blue-600 data-[state=completed]:bg-blue-600 data-[state=active]:text-white data-[state=completed]:text-white",
        className,
      )}
      data-slot="stepper-indicator"
      data-state={state}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          <span className="transition-all group-data-[state=completed]/step:scale-0 group-data-loading/step:scale-0 group-data-[state=completed]/step:opacity-0 group-data-loading/step:opacity-0 group-data-loading/step:transition-none">
            {step}
          </span>
          <Check
            aria-hidden="true"
            className="absolute scale-0 opacity-0 transition-all group-data-[state=completed]/step:scale-100 group-data-[state=completed]/step:opacity-100"
            size={16}
          />
          {isLoading && (
            <span className="absolute transition-all">
              <Loader2
                aria-hidden="true"
                className="animate-spin"
                size={14}
              />
            </span>
          )}
        </>
      )}
    </span>
  );
}

function StepperTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-medium text-sm", className)}
      data-slot="stepper-title"
      {...props}
    />
  );
}

function StepperDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-gray-500 text-sm", className)}
      data-slot="stepper-description"
      {...props}
    />
  );
}

function StepperSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "m-0.5 bg-gray-200 group-data-[orientation=horizontal]/stepper:h-0.5 group-data-[orientation=vertical]/stepper:h-12 group-data-[orientation=horizontal]/stepper:w-full group-data-[orientation=vertical]/stepper:w-0.5 group-data-[orientation=horizontal]/stepper:flex-1 group-data-[state=completed]/step:bg-blue-600",
        className,
      )}
      data-slot="stepper-separator"
      {...props}
    />
  );
}

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
  columns?: 1 | 2 | 3 | 4;
}

export interface MultiStepFormConfig<TData = Record<string, any>> {
  steps: FormStep[];
  onSubmit: (data: TData) => void | Promise<void>;
  onStepChange?: (step: number, data: Partial<TData>) => void;
  onComplete?: () => void;
  className?: string;
  submitButtonText?: string;
  submittingButtonText?: string;
  showStepLabels?: boolean;
  allowNavigateBack?: boolean;
  stepperOrientation?: "horizontal" | "vertical";
}

// ============================================================================
// Utility Components
// ============================================================================

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(" ");

// const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
//   variant?: "default" | "outline";
// }> = ({ className, variant = "default", children, ...props }) => (
//   <button
//     className={cn(
//       "px-2 py-1 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
//       variant === "default" && "bg-primary text-white hover:bg-primary-dark focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed",
//       variant === "outline" && "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
//       className
//     )}
//     {...props}
//   >
//     {children}
//   </button>
// );

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className,
  ...props
}) => (
  <input
    className={cn(
      "w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
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
    className={cn("block text-sm font-medium text-gray-700 dark:text-foreground mb-1", className)}
    {...props}
  >
    {children}
  </label>
);

const Separator: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("w-full h-px bg-gray-200 dark:bg-primary-foreground", className)} />
);

// ============================================================================
// Main Component
// ============================================================================

export function MultiStepForm<TData extends Record<string, any> = Record<string, any>>({
  steps,
  onSubmit,
  onStepChange,
  onComplete,
  className,
  submitButtonText = "Submit",
  submittingButtonText = "Submitting...",
  showStepLabels = true,
  allowNavigateBack = true,
  stepperOrientation = "horizontal",
}: MultiStepFormConfig<TData>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<TData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStepConfig = steps[currentStep];
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
        // Call onComplete callback instead of setting isComplete
        onComplete?.();
      } catch (error) {
        console.error("Form submission error:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [currentStep, formData, isLastStep, onSubmit, onStepChange, onComplete, reset]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 0 && allowNavigateBack) {
      setCurrentStep(prev => prev - 1);
      reset(formData);
    }
  }, [currentStep, formData, reset, allowNavigateBack]);

  const animationVariants = useMemo(() => ({
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  }), []);

  return (
    <div className={cn("w-full mx-auto p-2 mt-3 rounded-lg shadow-none", className)}>
      {/* Stepper + Form layout */}
      <div
        className={cn(
          "mb-8",
          stepperOrientation === "vertical" && "flex gap-8",
        )}
      >
        {/* Stepper */}
        <Stepper
          value={currentStep}
          orientation={stepperOrientation}
          className={stepperOrientation === "vertical" ? "min-w-[200px]" : ""}
        >
          {steps.map((step, index) => (
            <StepperItem
              key={step.id}
              step={index + 1}
              completed={index < currentStep}
              disabled={index > currentStep}
              className={cn(
                stepperOrientation === "horizontal" && "not-last:flex-1 max-md:items-start",
                stepperOrientation === "vertical" && "relative not-last:flex-1 items-start"
              )}
            >
              <StepperTrigger
                className={cn(
                  "gap-4 rounded",
                  stepperOrientation === "horizontal" && "max-md:flex-col",
                  stepperOrientation === "vertical" && "items-start pb-12 last:pb-0"
                )}
              >
                <StepperIndicator />
                <div className={cn(
                  stepperOrientation === "horizontal" && "md:-order-1 text-center md:text-left",
                  stepperOrientation === "vertical" && "mt-0.5 space-y-0.5 px-2 text-left"
                )}>
                  {showStepLabels && <StepperTitle>{step.title}</StepperTitle>}
                  {showStepLabels && step.description && (
                    <StepperDescription className={stepperOrientation === "horizontal" ? "max-sm:hidden" : ""}>
                      {step.description}
                    </StepperDescription>
                  )}
                </div>
              </StepperTrigger>
              {index < steps.length - 1 && (
                <StepperSeparator
                  className={cn(
                    stepperOrientation === "horizontal" && "max-md:mt-3.5 md:mx-4",
                    stepperOrientation === "vertical" && "-order-1 -translate-x-1/2 absolute inset-y-0 top-[calc(1.5rem+0.125rem)] left-3 m-0 group-data-[orientation=vertical]/stepper:h-[calc(100%-1.5rem-0.25rem)]"
                  )}
                />
              )}
            </StepperItem>
          ))}
        </Stepper>

        {/* Dotted vertical divider between steps and form when vertical */}
        {stepperOrientation === "vertical" && (
          <div className="border-l border-dashed border-muted-foreground/40" />
        )}

        {/* Form Content */}
        <div className={cn(stepperOrientation === "vertical" && "flex-1")}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={animationVariants}
              transition={{ duration: 0.3 }}
            >
              {stepperOrientation === "vertical" && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-primary-foreground">{currentStepConfig.title}</h2>
                  {currentStepConfig.description && (
                    <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">{currentStepConfig.description}</p>
                  )}
                </div>
              )}

              <div className={cn(
                "grid gap-6",
                currentStepConfig.columns === 1 && "grid-cols-1",
                currentStepConfig.columns === 2 && "grid-cols-1 md:grid-cols-2",
                currentStepConfig.columns === 3 && "grid-cols-1 md:grid-cols-3",
                currentStepConfig.columns === 4 && "grid-cols-1 md:grid-cols-4",
                !currentStepConfig.columns && "grid-cols-1 md:grid-cols-2", // default
                stepperOrientation === "horizontal" ? "mt-10" : "mt-6"
              )}>
                {currentStepConfig.fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Input
                      id={field.name}
                      type={field.type}
                      placeholder={field.placeholder}
                      {...register(field.name)}
                      className={cn(
                        errors[field.name] && "border-destructive focus:ring-destructive"
                      )}
                      aria-invalid={errors[field.name] ? "true" : "false"}
                      aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                    />
                    {field.description && !errors[field.name] && (
                      <p className="text-xs text-gray-500">{field.description}</p>
                    )}
                    {errors[field.name] && (
                      <p id={`${field.name}-error`} className="text-xs text-destructive" role="alert">
                        {errors[field.name]?.message as string}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="fixed bottom-0 left-0 right-0 w-full py-4 px-6">
                <Separator />
                <div className="flex justify-between pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    disabled={currentStep === 0 || !allowNavigateBack}
                    className={cn(
                      "flex items-center button",
                      (currentStep === 0 || !allowNavigateBack) && "invisible"
                    )}
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
                      <div className="flex items-center">
                        Next <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Demo Usage
// ============================================================================

const personalInfoSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

const addressSchema = z.object({
  street: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().min(5, "ZIP code must be at least 5 digits"),
});

const accountSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const formSteps = [
  {
    id: "personal",
    title: "Personal Info",
    description: "Tell us about yourself",
    schema: personalInfoSchema,
    fields: [
      { name: "firstName", label: "First Name", type: "text" as const, placeholder: "John" },
      { name: "lastName", label: "Last Name", type: "text" as const, placeholder: "Doe" },
      { name: "email", label: "Email", type: "email" as const, placeholder: "john@example.com" },
      { name: "phone", label: "Phone", type: "tel" as const, placeholder: "+1234567890" },
    ],
  },
  {
    id: "address",
    title: "Address",
    description: "Where do you live?",
    schema: addressSchema,
    fields: [
      { name: "street", label: "Street Address", type: "text" as const, placeholder: "123 Main St" },
      { name: "city", label: "City", type: "text" as const, placeholder: "New York" },
      { name: "state", label: "State", type: "text" as const, placeholder: "NY" },
      { name: "zip", label: "ZIP Code", type: "text" as const, placeholder: "10001" },
    ],
  },
  {
    id: "account",
    title: "Create Account",
    description: "Set up your credentials",
    schema: accountSchema,
    fields: [
      { name: "username", label: "Username", type: "text" as const, placeholder: "johndoe" },
      { name: "password", label: "Password", type: "password" as const, placeholder: "********" },
    ],
  },
];

export default function Demo() {
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Stepper Orientation</h3>
          <div className="flex gap-4">
            <button
              onClick={() => setOrientation("horizontal")}
              className={cn(
                "px-4 py-2 rounded-md font-medium transition-colors",
                orientation === "horizontal"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              )}
            >
              Horizontal
            </button>
            <button
              onClick={() => setOrientation("vertical")}
              className={cn(
                "px-4 py-2 rounded-md font-medium transition-colors",
                orientation === "vertical"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              )}
            >
              Vertical
            </button>
          </div>
        </div>
      </div>

      <MultiStepForm
        steps={formSteps}
        onSubmit={(data) => {
          console.log("Form submitted:", data);
          return new Promise((resolve) => setTimeout(resolve, 2000));
        }}
        onStepChange={(step, data) => {
          console.log("Step changed:", step, data);
        }}
        stepperOrientation={orientation}
      />
    </div>
  );
}