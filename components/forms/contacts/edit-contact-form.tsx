"use client"

import z from "zod";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
    MultiStepForm,
    type FormSelectOption,
    type FormStep,
} from "@/components/reusable components/reusable-multistep-form";
import { useToast } from "@/components/reusable components/toast-context";
import { useSheetControl } from "@/components/reusable components/reusable-sheet";
import { getLocationsDataset } from "@/lib/actions/catalog/location-options.actions";
import { UpdateContact } from "@/lib/actions/tenants/contacts.actions";
import type { Contact } from "@/database/tenant-schema";
import { useRouter } from "next/navigation";
import {IDOptions, RelationshipOptions, GenderOptions} from "@/lib/constants";

const contactInfoSchema = z.object({
    fullName: z.string().min(2),
    mobileNumber: z.string().min(7),
    altMobileNumber: z.string().optional(),
    email: z.preprocess((v) => (v === "" ? undefined : v), z.email().optional()),
    contactType: z.string().optional(),
    gender: z.string().optional(),
    idType: z.string().optional(),
    idNumber: z.string().optional(),
});

const addressSchema = z.object({
    region: z.string().optional(),
    district: z.string().optional(),
    ward: z.string().optional(),
    street: z.string().optional(),
});

const emergencySchema = z.object({
    firstNOKName: z.string().optional(),
    firstNOKMobile: z.string().optional(),
    firstNOKRelationship: z.string().optional(),
    secondNOKName: z.string().optional(),
    secondNOKMobile: z.string().optional(),
    secondNOKRelationship: z.string().optional(),
});

const contactTypeOptions: FormSelectOption[] = [
    { label: "Client", value: "CLIENT" },
    { label: "Land seller", value: "LAND_SELLER" },
    { label: "Auditor", value: "AUDITOR" },
    { label: "ICT Support", value: "ICT_SUPPORT" },
    { label: "Surveyor", value: "SURVEYOR" },
];

type LocationsState = {
    regions: FormSelectOption[];
    districtsByRegion: Record<string, FormSelectOption[]>;
};

const stepsBase: FormStep[] = [
    {
        id: "contact",
        title: "Contact Info",
        description: "",
        schema: contactInfoSchema,
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
        schema: addressSchema,
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
        schema: emergencySchema,
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

type EditContactFormProps = {
    contact: Contact;
};

const EditContactForm = ({ contact }: EditContactFormProps) => {
    const router = useRouter();
    const { showToast } = useToast();
    const sheet = useSheetControl();
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

    const stepsForEdit = useMemo<FormStep[]>(() => stepsWithLocations, [stepsWithLocations]);

    const initialData = useMemo(() => ({
        fullName: contact.fullName ?? "",
        mobileNumber: contact.mobileNumber ?? "",
        altMobileNumber: contact.altMobileNumber ?? "",
        email: contact.email ?? "",
        contactType: String(contact.contactType ?? "CLIENT"),
        gender: String(contact.gender ?? "MALE"),
        idType: String(contact.idType ?? ""),
        idNumber: contact.idNumber ?? "",

        region: contact.region ?? "",
        district: contact.district ?? "",
        ward: contact.ward ?? "",
        street: contact.street ?? "",

        firstNOKName: contact.firstNOKName ?? "",
        firstNOKMobile: contact.firstNOKMobile ?? "",
        firstNOKRelationship: String(contact.firstNOKRelationship ?? ""),
        secondNOKName: contact.secondNOKName ?? "",
        secondNOKMobile: contact.secondNOKMobile ?? "",
        secondNOKRelationship: String(contact.secondNOKRelationship ?? ""),
    }), [contact]);

    const handleSubmit = async (data: any) => {
        const fd = new FormData();
        fd.append("contactId", contact.id);

        const appendIfString = (key: string, value: unknown) => {
            if (typeof value === "string" && value.trim() !== "") fd.append(key, value);
        };

        // Contact
        appendIfString("fullName", data.fullName);
        appendIfString("mobileNumber", data.mobileNumber);
        appendIfString("altMobileNumber", data.altMobileNumber);
        appendIfString("email", data.email);
        appendIfString("contactType", data.contactType);
        appendIfString("gender", data.gender);
        appendIfString("idType", data.idType);
        appendIfString("idNumber", data.idNumber);

        // Address
        appendIfString("region", data.region);
        appendIfString("district", data.district);
        appendIfString("ward", data.ward);
        appendIfString("street", data.street);

        // Emergency
        appendIfString("firstNOKName", data.firstNOKName);
        appendIfString("firstNOKMobile", data.firstNOKMobile);
        appendIfString("firstNOKRelationship", data.firstNOKRelationship);
        appendIfString("secondNOKName", data.secondNOKName);
        appendIfString("secondNOKMobile", data.secondNOKMobile);
        appendIfString("secondNOKRelationship", data.secondNOKRelationship);

        const res = await UpdateContact(fd);
        if (!res.success) {
            showToast({
                title: "Failed to update contact",
                description: res.error,
                variant: "error",
                showAction: false,
            });
            throw new Error(res.error);
        }
        
        router.refresh();
        showToast({
            title: "Contact Updated",
            description: "Changes saved successfully.",
            variant: "success",
            showAction: false,
        });
    };

    return (
        <MultiStepForm
            steps={stepsForEdit}
            initialData={initialData}
            onSubmit={handleSubmit}
            submitButtonText="Save changes"
            submittingButtonText="Saving..."
            stepperOrientation="horizontal"
            onComplete={() => sheet?.close() }
        />
    );
}

export default EditContactForm