'use client'

import z from "zod";
import { FormStep, MultiStepForm } from "../reusable components/reusable-multistep-form";

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

const steps: FormStep[] = [
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

export const ProjectsForm = () => {
  const handleSubmit = async (data: any) => {
    console.log("Form submitted:", data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
  };

  const handleStepChange = (step: number, data: any) => {
    console.log(`Step ${step + 1} completed:`, data);
  };

  return (
    <div className="m-4">
      <MultiStepForm
        steps={steps}
        onSubmit={handleSubmit}
        onStepChange={handleStepChange}
        showStepLabels={true}
        allowNavigateBack={true}
      />
    </div>
  );
}