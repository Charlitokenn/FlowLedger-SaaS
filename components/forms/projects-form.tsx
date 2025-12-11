'use client'

import z from "zod";
import { useRef } from "react";
import { FormStep, MultiStepForm } from "../reusable components/reusable-multistep-form";
import { SheetClose } from "@/components/ui/sheet";
import { useToast } from "@/components/reusable components/toast-context";

const projectDetailsSchema = z.object({
    projectName: z.string().min(2, "Project name must be at least 2 characters"),
    region: z.string().min(2, "Region must be at least 2 characters"),
    district: z.string().min(2, "District must be at least 2 characters"),
    ward: z.string().min(2, "Ward must be at least 2 characters"),
    street: z.string().min(2, "Street must be at least 2 characters"),
    sqmBought: z.string().min(1, "Square meters bought must be at least 100"),
    numberOfPlots: z.string().min(1, "There must be at least 1 plot"),
    projectOwner: z.string().min(2, "Project owner must be at least 2 characters"),
});

const acquisitionDetailsSchema = z.object({
    acquisitionDate: z.date().refine(
        (date) => date <= new Date(),
        "Acquisition date must be on or before today"
    ),
    acquisitionValue: z.string().min(1, "Acquisition value must be at least 1000"),
    commitmentAmount: z.string().min(1, "Commitment amount must be at least 1000"),
    supplierName: z.string().min(2, "Supplier name must be at least 2 characters"),
});

const documentationSchema = z.object({
    tpStatus: z.enum(["In Progress", "Approved"], "Invalid TP status"),
    surveyStatus: z.enum(["In Progress", "Approved"], "Invalid Survey status"),
    tpNumber: z.string().min(2, "TP number must be at least 2 characters"),
    surveyNumber: z.string().min(2, "Survey number must be at least 2 characters"),
    originalContract: z.instanceof(File),
    tpDocument: z.instanceof(File),
    surveyDocument: z.instanceof(File),
});

const localGovtSchema = z.object({
    mwenyekitiName: z.string().min(2, "Mwenyekiti name must be at least 2 characters"),
    mwenyekitiMobile: z.string().max(12, "Mobile must have 12 numbers").min(12, "Mobile must have 12 numbers"),
    mtendajiName: z.string().min(2, "Mtendaji name must be at least 2 characters"),
    mtendajiMobile: z.string().max(12, "Mobile must have 12 numbers").min(12, "Mobile must have 12 numbers"),
    localGovtFee: z.coerce.number().min(1000, "Local government fee must be at least 1000"),
})

const statusOptions = [
    { label: "In Progress", value: "In Progress" },
    { label: "Approved", value: "Approved" },
] as const;

const regionOptions = [
    { label: "Dar es Salaam", value: "Dar es Salaam" },
    { label: "Arusha", value: "Arusha" },
] as const;

const districtsByRegion: Record<string, { label: string; value: string }[]> = {
    "Dar es Salaam": [
        { label: "Ilala", value: "Ilala" },
        { label: "Kinondoni", value: "Kinondoni" },
        { label: "Temeke", value: "Temeke" },
        { label: "Kigamboni", value: "Kigamboni" },
        { label: "Ubungo", value: "Ubungo" },
    ],
    Arusha: [
        { label: "Arusha City", value: "Arusha City" },
        { label: "Meru", value: "Meru" },
    ],
};

const steps: FormStep[] = [
    {
        id: "project",
        title: "Project Info",
        description: "Details about the project",
        schema: projectDetailsSchema,
        fields: [
            { name: "projectName", label: "Project Name", type: "text", placeholder: "Buyuni Project" },
            { name: "region", label: "Region", type: "select", placeholder: "Select region", options: regionOptions },
            {
                name: "district",
                label: "District",
                type: "select",
                placeholder: "Select district",
                dependsOn: "region",
                options: (values) => {
                    const region = values.region as string | undefined;
                    return region ? districtsByRegion[region] ?? [] : [];
                },
            },
            { name: "ward", label: "Ward", type: "text", placeholder: "Gulubwida" },
            { name: "street", label: "Street", type: "text", placeholder: "Gulubwida" },
            { name: "sqmBought", label: "Square Meters Bought", type: "number", placeholder: "1000" },
            { name: "numberOfPlots", label: "Number of Plots", type: "number", placeholder: "10" },
            { name: "projectOwner", label: "Project Owner", type: "text", placeholder: "John Mcharo" },
        ],
        columns: 3
    },
    {
        id: "acquisition",
        title: "Acquisition Details",
        description: "Details about the acquisition",
        schema: acquisitionDetailsSchema,
        fields: [
            { name: "acquisitionDate", label: "Acquisition Date", type: "date", placeholder: "YYYY-MM-DD" },
            { name: "acquisitionValue", label: "Acquisition Value", type: "number", placeholder: "10000" },
            { name: "supplierName", label: "Supplier Name", type: "text", placeholder: "Juma Salim" },
            { name: "commitmentAmount", label: "Commitment Amount", type: "number", placeholder: "5000" },
        ],
        columns: 2
    },
    {
        id: "documentation",
        title: "Documentation",
        description: "Upload project documentation",
        schema: documentationSchema,
        fields: [
            { name: "tpStatus", label: "TP Status", type: "select", placeholder: "Select TP status", options: [...statusOptions] },
            { name: "tpNumber", label: "TP Number", type: "text", placeholder: "TP12345" },
            { name: "tpDocument", label: "TP Document URL", type: "file", placeholder: "https://example.com/tp" },
            { name: "surveyStatus", label: "Survey Status", type: "select", placeholder: "Select Survey status", options: [...statusOptions] },
            { name: "surveyNumber", label: "Survey Number", type: "text", placeholder: "SURV12345" },
            { name: "surveyDocument", label: "Survey Document URL", type: "file", placeholder: "https://example.com/survey" },
            { name: "originalContract", label: "Original Contract URL", type: "file", placeholder: "https://example.com/contract" },
        ],
        columns: 3
    },
    {
        id: "localGovt",
        title: "Local Government",
        description: "Local government details",
        schema: localGovtSchema,
        fields: [
            { name: "mwenyekitiName", label: "Mwenyekiti Name", type: "text", placeholder: "John Doe" },
            { name: "mwenyekitiMobile", label: "Mwenyekiti Mobile", type: "phone", placeholder: "+255700123456", defaultCountry: "TZ" },
            { name: "mtendajiName", label: "Mtendaji Name", type: "text", placeholder: "Jane Smith" },
            { name: "mtendajiMobile", label: "Mtendaji Mobile", type: "phone", placeholder: "+255700123456", defaultCountry: "TZ" },
            { name: "localGovtFee", label: "Local Government Fee (TZS)", type: "number", placeholder: "10000" },
        ],
        columns: 2
    }
]

export const ProjectsForm = () => {
    const { showToast } = useToast();
    const closeRef = useRef<HTMLButtonElement | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
        console.log("Form submitted:", data);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleStepChange = (step: number, data: any) => {
        console.log(`Step ${step + 1} completed:`, data);
    };

    return (
        <>
            {/* Hidden close button hooked into the current Sheet context */}
            <SheetClose render={<button ref={closeRef} className="hidden" />} />

            <MultiStepForm
                steps={steps}
                onSubmit={handleSubmit}
                onStepChange={handleStepChange}
                showStepLabels={true}
                allowNavigateBack={true}
                stepperOrientation="vertical"
                onComplete={() => {
                    // Show custom toast via ToastContext
                    showToast({
                        title: "Project created",
                        description: "Your project has been created successfully.",
                        variant: "success",
                        showAction: false,
                    });

                    // Close the enclosing Sheet dialog
                    closeRef.current?.click();
                }}
            />
        </>
    );
};
