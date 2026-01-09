'use client'

import z from "zod";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { MultiStepForm } from "../../reusable components/reusable-multistep-form";
import { SheetClose } from "@/components/ui/sheet";
import { useToast } from "@/components/reusable components/toast-context";
import { getLocationsDataset } from "@/lib/actions/catalog/location-options.actions";
import { CreateContact } from "@/lib/actions/tenants/contacts.actions";
import { useRouter } from "next/navigation";
import {IDOptions, RelationshipOptions, GenderOptions} from "@/lib/constants";

const contactDetailsSchema = z.object({
    fullName: z.string().min(2, "Contact name must be at least 2 characters"),
    mobileNumber: z.string().min(12, "Enter a valid mobile number"),
    altMobileNumber: z.string().min(12, "Enter a valid mobile number").optional(),
    email: z.preprocess((v) => (v === "" ? undefined : v), z.email().optional()),
    contactType: z.string().min(2, "Select contact type"),
    gender: z.string().min(2, "Gender should be selected"),
    idType: z.string().min(1, "Select Id Type").optional(),
    idNumber: z.string().max(200, "Enter valid id number").optional(),
});

const locationDetailsSchema = z.object({
    region: z.string().optional(),
    district: z.string().optional(),
    ward: z.string().optional(),
    street: z.string().optional(),
});

const emergencyContactSchema = z.object({
    firstNOKName: z.string().optional(),
    firstNOKMobile: z.string().regex(/^\+[1-9]\d{1,14}$/,"Mobile number e.g +255712000111)").optional(),
    firstNOKRelationship: z.string().optional(),
    secondNOKName: z.string().optional(),
    secondNOKMobile: z.string().regex(/^\+[1-9]\d{1,14}$/,"Mobile number e.g +255712000111)").optional(),
    secondNOKRelationship: z.string().optional(),
});

const contactTypeOptions = [
    { label: "Client", value: "CLIENT" },
    { label: "Land Seller", value: "LAND_SELLER" },
    { label: "Auditor", value: "AUDITOR" },
    { label: "Surveyor", value: "SURVEYOR" },
    { label: "ICT Support", value: "ICT SUPPORT" },
] as const;

type LocationsState = {
    regions: FormSelectOption[];
    districtsByRegion: Record<string, FormSelectOption[]>;
};

const stepsBase: FormStep[] = [
    {
        id: "contact",
        title: "Contact Info",
        description: "",
        schema: contactDetailsSchema,
        fields: [
            { name: "contactType", label: "Contact Type", type: "select", placeholder: "Select Type", options: [...contactTypeOptions] },
            { name: "fullName", label: "Full Name", type: "text", placeholder: "John Doe" },
            { name: "mobileNumber", label: "Mobile Number", type: "phone", placeholder: "e.g 255712000111" },
            { name: "altMobileNumber", label: "Alt Mobile Number", type: "phone", placeholder: "e.g 255712000111" },
            { name: "email", label: "Email", type: "email", placeholder: "Enter valid email" },
            { name: "gender", label: "Gender", type: "select", placeholder: "Select gender", options: [...GenderOptions] },
            { name: "idType", label: "ID Type", type: "select", placeholder: "Select ID Type", options: [...IDOptions] },
            { name: "idNumber", label: "ID Number", type: "text", placeholder: "Enter valid ID Number" },
        ],
        columns: 2
    },
    {
        id: "location",
        title: "Contact's Address",
        description: "",
        schema: locationDetailsSchema,
        fields: [
            { name: "region", label: "Region", type: "select", placeholder: "Select region", options: [] },
            { name: "district", label: "District", type: "select", placeholder: "Select district", dependsOn: "region", options: [] },
            { name: "ward", label: "Ward", type: "text", placeholder: "Enter ward name" },
            { name: "street", label: "Street", type: "number", placeholder: "Enter street name" },
        ],
        columns: 2
    },
    {
        id: "emergency",
        title: "Next of Keen Details",
        description: "",
        schema: emergencyContactSchema,
        fields: [
            { name: "firstNOKName", label: "NOK 1: Full Name", type: "text", placeholder: "Full name" },
            { name: "firstNOKMobile", label: "Mobile", type: "phone", placeholder: "e.g. 255712000111" },
            { name: "firstNOKRelationship", label: "Relationship", type: "select", options: [...RelationshipOptions] },
            { name: "secondNOKName", label: "NOK 2: Full Name", type: "text", placeholder: "Full name" },
            { name: "secondNOKMobile", label: "Mobile", type: "phone", placeholder: "e.g. 255712000111" },
            { name: "secondNOKRelationship", label: "Relationship", type: "select", options: [...RelationshipOptions] },
        ],
        columns: 3
    }
]

const AddContactsForm = () => {
    const router = useRouter();
    const { showToast: contactsToast } = useToast();
    const closeRef = useRef<HTMLButtonElement | null>(null);
    const [, startTransition] = useTransition();

    const [locations, setLocations] = useState<LocationsState>({
        regions: [],
        districtsByRegion: {},
    });

    useEffect(() => {
        startTransition(async () => {
            const res = await getLocationsDataset();
            if (!res.success) return;

            setLocations({
                regions: res.data.regions,
                districtsByRegion: res.data.districtsByRegion,
            });
        });
    }, []);

    const stepsWithLocations = useMemo<FormStep[]>(() => {
        const regionOpts = locations.regions;

        return stepsBase.map((s) => {
            if (s.id !== "location") return s;

            return {
                ...s,
                fields: s.fields.map((f) => {
                    if (f.type !== "select") return f;

                    if (f.name === "region") {
                        return { ...f, options: regionOpts };
                    }

                    if (f.name === "district") {
                        return {
                            ...f,
                            // Make districts depend on selected region
                            options: (values) => {
                                const region = values.region as string | undefined;
                                return region ? locations.districtsByRegion[region] ?? [] : [];
                            },
                        };
                    }

                    return f;
                }),
            };
        });
    }, [locations.districtsByRegion, locations.regions]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
        const fd = new FormData();

        const appendIfString = (key: string, value: unknown) => {
            if (typeof value === "string") fd.append(key, value);
        };

        const appendIfNumber = (key: string, value: unknown) => {
            if (typeof value === "number" && Number.isFinite(value)) {
                fd.append(key, value.toString());
            }
        };

        const formatLocalYmd = (d: Date) => {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            return `${yyyy}-${mm}-${dd}`;
        };

        const appendIfDate = (key: string, value: unknown) => {
            if (value instanceof Date && !Number.isNaN(value.getTime())) {
                // IMPORTANT: avoid `toISOString()` here (UTC conversion can shift the calendar day).
                fd.append(key, formatLocalYmd(value));
            }
        };

        const appendIfFile = (key: string, value: unknown) => {
            if (value instanceof File && value.size > 0) {
                fd.append(key, value);
                return;
            }
            if (Array.isArray(value) && value[0] instanceof File) {
                // If a field was configured as multiple, take the first file.
                const first = value[0] as File;
                if (first.size > 0) fd.append(key, first);
            }
        };

        // Step: Contact
        appendIfString("fullName", data.fullName);
        appendIfString("mobileNumber", data.mobileNumber);
        appendIfString("altMobileNumber", data.altMobileNumber);
        appendIfString("contactType", data.contactType);
        appendIfString("email", data.email);
        appendIfString("gender", data.gender);
        appendIfString("idType", data.idType);
        appendIfString("idNumber", data.idNumber);

        // Step: Location
        appendIfString("regions", data.regions);
        appendIfString("district", data.district);
        appendIfString("ward", data.ward);
        appendIfString("street", data.street);

        // Step: Emergency
        appendIfString("firstNOKName", data.firstNOKName);
        appendIfString("firstNOKMobile", data.firstNOKMobile);
        appendIfString("firstNOKRelationship", data.firstNOKRelationship);
        appendIfString("secondNOKName", data.secondNOKName);
        appendIfString("secondNOKMobile", data.secondNOKMobile);
        appendIfString("secondNOKRelationship", data.secondNOKRelationship);

        const res = await CreateContact(fd);
        if (!res.success) {
            contactsToast({
                title: "Failed to create contact",
                description: res.error,
                variant: "error",
                showAction: false,
            });
            throw new Error(res.error);
        }
        //TODO - Referesh after adding projects not working
        router.refresh();
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
                steps={stepsWithLocations}
                onSubmit={handleSubmit}
                onStepChange={handleStepChange}
                showStepLabels={true}
                allowNavigateBack={true}
                stepperOrientation="horizontal"
                onComplete={() => {
                    // Show custom toast via ToastContext
                    contactsToast({
                        title: "Contact created",
                        description: "Your contact has been created successfully.",
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

export default AddContactsForm