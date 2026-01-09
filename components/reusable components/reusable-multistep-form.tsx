"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState, useCallback, useMemo, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Calendar as CalendarIcon,
  Upload,
  X,
  ChevronsUpDown,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "../ui/button";
import { Input as ShadcnInput } from "../ui/input";
import { PhoneInput } from "../ui/base-phone-input";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Spinner } from "../loading/spinner";

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

export type FormSelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export type FormSelectOptionsResolver<TValues extends Record<string, any> = Record<string, any>> = (
  values: TValues,
) => ReadonlyArray<FormSelectOption>;

export type FormField =
  | {
    name: string;
    label: string;
    type: "text" | "email" | "password" | "number" | "tel" | "url";
    placeholder?: string;
    description?: string;
  }
  | {
    name: string;
    label: string;
    type: "date";
    placeholder?: string;
    description?: string;
    min?: string;
    max?: string;
  }
  | {
    name: string;
    label: string;
    type: "select";
    placeholder?: string;
    description?: string;
    /** If provided, the select will be disabled until this field (or fields) have a value. */
    dependsOn?: string | string[];
    /** Static options or a resolver function that can depend on other field values. */
    options: ReadonlyArray<FormSelectOption> | FormSelectOptionsResolver;
  }
  | {
    name: string;
    label: string;
    type: "file";
    placeholder?: string;
    description?: string;
    accept?: string;
    multiple?: boolean;
  }
  | {
    name: string;
    label: string;
    type: "phone";
    placeholder?: string;
    description?: string;
    defaultCountry?: string;
  };

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
  /** Optional initial values (useful for edit forms). */
  initialData?: Partial<TData>;
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


function FileDropzone({
  id,
  accept,
  multiple,
  value,
  onChange,
  hasError,
  ariaDescribedBy,
}: {
  id: string;
  accept?: string;
  multiple?: boolean;
  value: unknown;
  onChange: (next: File | File[] | null) => void;
  hasError: boolean;
  ariaDescribedBy?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const files: File[] = Array.isArray(value)
    ? (value as File[])
    : value instanceof File
      ? [value]
      : [];

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "relative flex items-center justify-between gap-3 rounded-lg border border-dashed border-input bg-muted/10 px-4 py-4 text-sm cursor-pointer",
          hasError && "border-destructive",
        )}
        aria-describedby={ariaDescribedBy}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            const list = e.target.files;
            if (!list || list.length === 0) {
              onChange(null);
              return;
            }
            onChange(multiple ? Array.from(list) : list[0]);
          }}
        />

        <div className="min-w-0 flex items-center gap-3">
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-md border bg-background",
              hasError && "border-destructive",
            )}
          >
            <Upload className="size-4 text-muted-foreground" />
          </span>

          <div className="min-w-0">
            <p className="truncate font-medium">
              {files.length === 0
                ? "Drop a file here, or click to browse"
                : files.length === 1
                  ? files[0].name
                  : `${files.length} files selected`}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {files.length === 0
                ? accept
                  ? `Accepted: ${accept}`
                  : ""
                : "Click to replace"}
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange(null);
              if (inputRef.current) {
                inputRef.current.value = "";
              }
            }}
            className="shrink-0"
            aria-label="Remove file"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function SearchableSelectField({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  hasError,
  ariaDescribedBy,
}: {
  value: string;
  onChange: (next: string) => void;
  options: ReadonlyArray<FormSelectOption>;
  placeholder?: string;
  disabled?: boolean;
  hasError: boolean;
  ariaDescribedBy?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const selectedLabel = React.useMemo(() => {
    return options.find((o) => o.value === value)?.label;
  }, [options, value]);

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={ariaDescribedBy}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground",
              hasError && "border-destructive",
            )}
          >
            <span className="truncate">
              {selectedLabel ?? placeholder ?? "Select an option"}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  disabled={opt.disabled}
                  onSelect={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      opt.value === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function DatePickerField({
  id,
  value,
  onChange,
  placeholder,
  min,
  max,
  hasError,
  ariaDescribedBy,
}: {
  id: string;
  value: Date | undefined;
  onChange: (next: Date | undefined) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  hasError: boolean;
  ariaDescribedBy?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date | undefined>(value);
  const [textValue, setTextValue] = React.useState<string>(
    value ? format(value, "PPP") : "",
  );

  const minDate = React.useMemo(() => (min ? new Date(min) : undefined), [min]);
  const maxDate = React.useMemo(() => (max ? new Date(max) : undefined), [max]);

  React.useEffect(() => {
    setTextValue(value ? format(value, "PPP") : "");
    setMonth(value);
  }, [value]);

  return (
    <div className="relative flex gap-2 w-full">
      <ShadcnInput
        id={id}
        value={textValue}
        placeholder={placeholder ?? "Select date"}
        className={cn("bg-background pr-10 w-full", hasError && "border-destructive")}
        aria-invalid={hasError || undefined}
        aria-describedby={ariaDescribedBy}
        onChange={(e) => {
          const nextText = e.target.value;
          setTextValue(nextText);
          const parsed = new Date(nextText);
          if (!Number.isNaN(parsed.getTime())) {
            onChange(parsed);
            setMonth(parsed);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={`${id}-date-picker`}
            type="button"
            variant="ghost"
            className="absolute top-1/2 right-3 size-6 -translate-y-1/2"
          >
            <CalendarIcon className="size-3.5" />
            <span className="sr-only">Select date</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-hidden p-0"
          align="end"
          alignOffset={-8}
          sideOffset={10}
        >
          <Calendar
            mode="single"
            selected={value}
            captionLayout="dropdown"
            month={month}
            onMonthChange={setMonth}
            onSelect={(d) => {
              onChange(d);
              setTextValue(d ? format(d, "PPP") : "");
              setOpen(false);
            }}
            disabled={(d) => {
              if (minDate && d < minDate) return true;
              if (maxDate && d > maxDate) return true;
              return false;
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

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
  initialData,
  className,
  submitButtonText = "Submit",
  submittingButtonText = "Submitting...",
  showStepLabels = true,
  allowNavigateBack = true,
  stepperOrientation = "horizontal",
}: MultiStepFormConfig<TData>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<TData>>(() => initialData ?? {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStepConfig = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const {
    register,
    control,
    getValues,
    setValue,
    trigger,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<any>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(currentStepConfig.schema as any),
    defaultValues: formData as any,
    mode: "onBlur",
  });

  const watchedValues = useWatch({ control });

  // If a dependent select's options change and the current value no longer exists, clear it.
  // Example: if Region changes, the District options list changes.
  useEffect(() => {
    const fields = currentStepConfig.fields;
    const values = (watchedValues ?? {}) as Record<string, any>;

    for (const f of fields) {
      if (f.type !== "select" || typeof f.options !== "function") continue;

      const opts = f.options(values);
      const currentValue = getValues(f.name);
      if (!currentValue) continue;

      const exists = opts.some((o) => o.value === currentValue);
      if (!exists) {
        // Mark touched + revalidate so errors are correct after dependency changes.
        setValue(f.name, "", {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }
    }
  }, [currentStep, currentStepConfig.fields, getValues, setValue, watchedValues]);

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
      reset(formData as any);
    }
  }, [currentStep, formData, reset, allowNavigateBack]);

  const animationVariants = useMemo(() => ({
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  }), []);

  return (
    <div className={cn("w-full mx-auto p-2 mt-3 rounded-lg shadow-none relative", className)}>
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
                {currentStepConfig.fields.map((field) => {
                  const hasError = Boolean(errors[field.name]);

                  const resolveSelectOptions = (
                    f: Extract<FormField, { type: "select" }>,
                    values: Record<string, any>,
                  ) => {
                    return typeof f.options === "function" ? f.options(values) : f.options;
                  };

                  const isSelectDisabled = (
                    f: Extract<FormField, { type: "select" }>,
                    values: Record<string, any>,
                    resolvedOptions: ReadonlyArray<FormSelectOption>,
                  ) => {
                    if (resolvedOptions.length === 0) return true;
                    if (!f.dependsOn) return false;

                    const deps = Array.isArray(f.dependsOn) ? f.dependsOn : [f.dependsOn];
                    return deps.some((d) => !values[d]);
                  };

                  const values = (watchedValues ?? {}) as Record<string, any>;

                  return (
                    <div key={field.name} className="space-y-2">
                      <Label htmlFor={field.name}>{field.label}</Label>

                      {field.type === "select" ? (
                        <Controller
                          control={control}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          name={field.name as any}
                          render={({ field: rhfField }) => {
                            const resolved = resolveSelectOptions(field, values);
                            const disabled = isSelectDisabled(field, values, resolved);

                            return (
                              <SearchableSelectField
                                value={(rhfField.value ?? "") as string}
                                onChange={(next) => {
                                  rhfField.onChange(next);
                                  void trigger(field.name as any);
                                }}
                                options={resolved}
                                placeholder={field.placeholder}
                                disabled={disabled}
                                hasError={hasError}
                                ariaDescribedBy={
                                  hasError ? `${field.name}-error` : undefined
                                }
                              />
                            );
                          }}
                        />
                      ) : field.type === "phone" ? (
                        <Controller
                          control={control}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          name={field.name as any}
                          render={({ field: rhfField }) => (
                            <PhoneInput
                              placeholder={field.placeholder}
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              defaultCountry={field.defaultCountry as any}
                              value={rhfField.value}
                              onChange={(v) => {
                                rhfField.onChange(v);
                                void trigger(field.name as any);
                              }}
                              aria-invalid={hasError || undefined}
                              aria-describedby={hasError ? `${field.name}-error` : undefined}
                            />
                          )}
                        />
                      ) : field.type === "date" ? (
                        <Controller
                          control={control}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          name={field.name as any}
                          render={({ field: rhfField }) => (
                            <DatePickerField
                              id={field.name}
                              value={rhfField.value as Date | undefined}
                              onChange={(d) => {
                                rhfField.onChange(d);
                                void trigger(field.name as any);
                              }}
                              placeholder={field.placeholder}
                              min={field.min}
                              max={field.max}
                              hasError={hasError}
                              ariaDescribedBy={
                                hasError ? `${field.name}-error` : undefined
                              }
                            />
                          )}
                        />
                      ) : field.type === "file" ? (
                        <Controller
                          control={control}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          name={field.name as any}
                          render={({ field: rhfField }) => (
                            <FileDropzone
                              id={field.name}
                              accept={field.accept}
                              multiple={field.multiple}
                              value={rhfField.value}
                              onChange={(v) => rhfField.onChange(v)}
                              hasError={hasError}
                              ariaDescribedBy={
                                hasError ? `${field.name}-error` : undefined
                              }
                            />
                          )}
                        />
                      ) : (
                        <ShadcnInput
                          id={field.name}
                          type={field.type}
                          placeholder={field.placeholder}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          {...register(field.name as any)}
                          className={cn(hasError && "has-aria-invalid:border-destructive")}
                          aria-invalid={hasError || undefined}
                          aria-describedby={hasError ? `${field.name}-error` : undefined}
                        />
                      )}

                      {field.description && !hasError && (
                        <p className="text-xs text-gray-500">{field.description}</p>
                      )}
                      {hasError && (
                        <p
                          id={`${field.name}-error`}
                          className="text-xs text-destructive"
                          role="alert"
                        >
                          {errors[field.name]?.message as string}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Navigation Buttons */}
              <div className="fixed bottom-4 left-8 right-8 flex justify-between pt-4  border-t border-gray-200">
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
                  className="btn-primary"
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

      //TODO - Fixt too many api bug after form update/submit
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