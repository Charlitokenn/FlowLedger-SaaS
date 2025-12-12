"use server";

import { auth } from "@clerk/nextjs/server";
import { projects, type NewProject } from "@/database/tenant-schema";
import { uploadDocumentToCloudinary } from "@/lib/cloudinary/cloudinary.server";
import { getTenantDbForRequest, MISSING_TENANT_CONTEXT_ERROR } from "@/lib/tenant-context";
import { desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const GetAllProjects = async () => {
    try {
        const { db } = await getTenantDbForRequest();

        const results = await db
            .select()
            .from(projects)
            .where(eq(projects.isDeleted, false))
            .orderBy(desc(projects.acquisitionDate));

        return { success: true, data: results };
    } catch (error) {
        console.error("Error fetching projects:", error);
        return {
            success: false,
            error:
                error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
                    ? "Unauthorized"
                    : error instanceof Error
                        ? error.message
                        : "Failed to fetch projects",
        };
    }
};

export const SoftDeleteProjects = async (ids: string[]) => {
    try {
        const { db } = await getTenantDbForRequest();

        const results = await db
            .update(projects)
            .set({ isDeleted: true })
            .where(inArray(projects.id, ids))
            .returning();
        // Revalidate the projects page route so deleted records disappear
        revalidatePath("/projects");

        return { success: true, data: results };

    } catch (error) {
        console.error("Error deleting projects:", error);
        return {
            success: false,
            error:
                error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
                    ? "Unauthorized"
                    : error instanceof Error
                        ? error.message
                        : "Failed to delete project",
        };
    }
};

export async function BulkImportProjects(rows: NewProject[]) {
    try {
        if (!rows.length) {
            return { success: true, inserted: 0 };
        }

        const { db } = await getTenantDbForRequest();

        await db.insert(projects).values(rows);

        revalidatePath("/projects");

        return { success: true, inserted: rows.length };
    } catch (error) {
        console.error("Bulk import projects failed", error);
        return {
            success: false,
            error:
                error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
                    ? "Unauthorized"
                    : error instanceof Error
                        ? error.message
                        : "Failed to import projects",
        } as const;
    }
}

const CreateProjectSchema = z.object({
    projectName: z.string().min(2),
    region: z.string().min(2),
    district: z.string().min(2),
    ward: z.string().min(2),
    street: z.string().min(2),
    sqmBought: z.string().min(1),
    numberOfPlots: z.string().min(1),
    projectOwner: z.string().optional(),

    acquisitionDate: z.string().min(4), // YYYY-MM-DD
    acquisitionValue: z.string().min(1),
    commitmentAmount: z.string().min(1),
    supplierName: z.string().min(2),

    tpStatus: z.string().optional(),
    tpNumber: z.string().optional(),
    surveyStatus: z.string().optional(),
    surveyNumber: z.string().optional(),

    mwenyekitiName: z.string().optional(),
    mwenyekitiMobile: z.string().optional(),
    mtendajiName: z.string().optional(),
    mtendajiMobile: z.string().optional(),
    localGovtFee: z.string().optional(),
});

type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

function getString(formData: FormData, key: string): string | undefined {
    const v = formData.get(key);
    if (typeof v === "string") return v;
    return undefined;
}

function getFile(formData: FormData, key: string): File | undefined {
    const v = formData.get(key);
    if (typeof v === "object" && v instanceof File) {
        // Some browsers send an empty File when no file selected.
        if (!v.name || v.size === 0) return undefined;
        return v;
    }
    return undefined;
}

function toDateOnlyString(value: string): string {
    // Accept ISO date or datetime and normalize to YYYY-MM-DD.
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
        // If it's already YYYY-MM-DD-ish, pass through (DB will validate).
        return value;
    }
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function isUuid(v: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function CreateProject(formData: FormData) {
    try {
        const { db } = await getTenantDbForRequest();
        const { userId } = await auth();

        const raw: Partial<CreateProjectInput> = {
            projectName: getString(formData, "projectName"),
            region: getString(formData, "region"),
            district: getString(formData, "district"),
            ward: getString(formData, "ward"),
            street: getString(formData, "street"),
            sqmBought: getString(formData, "sqmBought"),
            numberOfPlots: getString(formData, "numberOfPlots"),
            projectOwner: getString(formData, "projectOwner"),

            acquisitionDate: getString(formData, "acquisitionDate"),
            acquisitionValue: getString(formData, "acquisitionValue"),
            commitmentAmount: getString(formData, "commitmentAmount"),
            supplierName: getString(formData, "supplierName"),

            tpStatus: getString(formData, "tpStatus"),
            tpNumber: getString(formData, "tpNumber"),
            surveyStatus: getString(formData, "surveyStatus"),
            surveyNumber: getString(formData, "surveyNumber"),

            mwenyekitiName: getString(formData, "mwenyekitiName"),
            mwenyekitiMobile: getString(formData, "mwenyekitiMobile"),
            mtendajiName: getString(formData, "mtendajiName"),
            mtendajiMobile: getString(formData, "mtendajiMobile"),
            localGovtFee: getString(formData, "localGovtFee"),
        };

        const parsed = CreateProjectSchema.safeParse(raw);
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues.map((i) => i.message).join(", "),
            } as const;
        }

        const input = parsed.data;

        // Upload docs first (so we only insert when uploads succeed).
        const originalContract = getFile(formData, "originalContract");
        const tpDocument = getFile(formData, "tpDocument");
        const surveyDocument = getFile(formData, "surveyDocument");

        const allowedDocTypes = ["application/pdf"] as const;

        const [contractUpload, tpUpload, surveyUpload] = await Promise.all([
            originalContract
                ? uploadDocumentToCloudinary({
                    file: originalContract,
                    folder: "Contracts",
                    publicIdPrefix: `${input.projectName}-contract`,
                    allowedMimeTypes: allowedDocTypes,
                })
                : Promise.resolve(undefined),
            tpDocument
                ? uploadDocumentToCloudinary({
                    file: tpDocument,
                    folder: "Town plans",
                    publicIdPrefix: `${input.projectName}-tp`,
                    allowedMimeTypes: allowedDocTypes,
                })
                : Promise.resolve(undefined),
            surveyDocument
                ? uploadDocumentToCloudinary({
                    file: surveyDocument,
                    folder: "Survey Plans",
                    publicIdPrefix: `${input.projectName}-survey`,
                    allowedMimeTypes: allowedDocTypes,
                })
                : Promise.resolve(undefined),
        ]);

        // supplier_name is currently a UUID in the schema. If the UI provides a plain name,
        // store it in projectDetails so it is not lost.
        const supplierAsUuid = isUuid(input.supplierName) ? input.supplierName : undefined;
        const supplierNameText = supplierAsUuid ? undefined : input.supplierName;

        const row: NewProject = {
            projectName: input.projectName,
            acquisitionDate: toDateOnlyString(input.acquisitionDate),
            acquisitionValue: input.acquisitionValue,

            region: input.region,
            district: input.district,
            ward: input.ward,
            street: input.street,
            sqmBought: input.sqmBought,
            numberOfPlots: input.numberOfPlots,
            projectOwner: input.projectOwner,

            committmentAmount: input.commitmentAmount,
            supplierName: supplierAsUuid,
            projectDetails: supplierNameText ? `Supplier: ${supplierNameText}` : undefined,

            tpStatus: input.tpStatus,
            tpNumber: input.tpNumber,
            surveyStatus: input.surveyStatus,
            surveyNumber: input.surveyNumber,

            originalContractPdf: contractUpload?.secureUrl,
            tpUrl: tpUpload?.secureUrl,
            surveyUrl: surveyUpload?.secureUrl,

            mwenyekitiName: input.mwenyekitiName,
            mwenyekitiMobile: input.mwenyekitiMobile,
            mtendajiName: input.mtendajiName,
            mtendajiMobile: input.mtendajiMobile,
            lgaFee: input.localGovtFee,

            addedBy: userId ?? undefined,
            isDeleted: false,
        };

        const inserted = await db.insert(projects).values(row).returning();

        revalidatePath("/projects");

        return { success: true, data: inserted[0] } as const;
    } catch (error) {
        console.error("CreateProject failed", error);
        return {
            success: false,
            error:
                error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
                    ? "Unauthorized"
                    : error instanceof Error
                        ? error.message
                        : "Failed to create project",
        } as const;
    }
}
