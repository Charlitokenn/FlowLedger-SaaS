"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {PhoneInput} from "@/components/ui/base-phone-input";
import {BrandColorPicker} from "@/components/brand-color-picker";
import {zodToProperCase} from "@/lib/zod-transformers";
import React, {useState} from "react";
import {updateTenantSettings} from "@/lib/actions/catalog/settings.actions";
import {Badge} from "@/components/ui/badge";
import {InputGroup, InputGroupAddon} from "@/components/ui/input-group";
import {AtSign, MapPin, Megaphone, Link} from "lucide-react";

const settingSchema = z.object({
    slogan: z.string().optional().transform((val) => val ? zodToProperCase(val) : val),
    mobile: z.string().optional(),
    email: z.email("Invalid email address").optional().or(z.literal('')),
    address: z.string().optional().transform((val) => val ? zodToProperCase(val) : val),
    color: z.string().optional(),
    website: z.url().optional(),
})

type SettingFormValues = z.infer<typeof settingSchema>;

interface SettingsPageProps {
    initialValues?: Partial<SettingFormValues>;
}

export function SettingsPage({ initialValues }: SettingsPageProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [result, setResult] = useState<{ error?: string }>({});

    const form = useForm<SettingFormValues>({
        resolver: zodResolver(settingSchema),
        defaultValues: {
            slogan: initialValues?.slogan ?? "",
            mobile: initialValues?.mobile ?? "",
            email: initialValues?.email ?? "",
            address: initialValues?.address ?? "",
            color: initialValues?.color ?? "",
            website: initialValues?.website ?? "",
        },
    })

    const onSubmit = async (values: SettingFormValues) => {
        try {
            setIsSubmitting(true);
            console.log("Submitting values:", values);

            // Call your server action or API
            const result = await updateTenantSettings(values);

            if (result.success) {
                // Update form with the saved values (keeps them displayed)
                form.reset(values, {
                    keepValues: true,  // Keep the current values
                    keepDirty: false,  // Mark form as clean (not dirty)
                });
            } else {
                setResult({ error: result.error || "Failed to update settings" });
                // console.error(result.error || "Failed to update settings");
            }
        } catch (error) {
            console.error("Error updating settings:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                        control={form.control}
                        name="slogan"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Brand Slogan</FormLabel>
                                <FormControl>
                                    <InputGroup>
                                        <Input
                                        placeholder="Enter brand slogan"
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                        <InputGroupAddon>
                                            <Megaphone />
                                        </InputGroupAddon>
                                    </InputGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="mobile"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Official Mobile</FormLabel>
                                <FormControl>
                                    <PhoneInput
                                        value={field.value ?? ""}
                                        onChange={(phoneValue) => {
                                            const normalized = phoneValue ?? "";
                                            field.onChange(normalized);
                                        }}
                                        onBlur={field.onBlur}
                                        name={field.name}
                                        placeholder="Enter mobile e.g 255712000111"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Official Email</FormLabel>
                                <FormControl>
                                    <InputGroup>
                                        <Input
                                            type="email"
                                            placeholder="email@example.com"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                        <InputGroupAddon>
                                            <AtSign />
                                        </InputGroupAddon>
                                    </InputGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Office Location</FormLabel>
                                <FormControl>
                                    <InputGroup>
                                        <Input
                                            placeholder="Enter office location"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                        <InputGroupAddon>
                                            <MapPin />
                                        </InputGroupAddon>
                                    </InputGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Corporate Website</FormLabel>
                                <FormControl>
                                    <InputGroup>
                                        <Input
                                            placeholder="Official website"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                        <InputGroupAddon>
                                            <Link />
                                        </InputGroupAddon>
                                </InputGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Brand Color</FormLabel>
                            <FormControl>
                                <BrandColorPicker
                                    value={field.value ?? ""}
                                    onChange={field.onChange}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    disabled={isSubmitting || !form.formState.isDirty}
                    className="cursor-pointer mt-6"
                >
                    {isSubmitting ? "Updating..." : "Update Settings"}
                </Button>
                <Badge className="bg-red-600">{result.error}</Badge>
            </form>
        </Form>
    )
}