"use server";

import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { plots, Project, projects, type NewProject } from "@/database/tenant-schema";
import { deleteR2Object, getPresignedGetUrl, uploadPdfToR2 } from "@/lib/r2/r2.server";
import { getTenantDbForRequest, MISSING_TENANT_CONTEXT_ERROR } from "@/lib/tenant-context";
import { desc, eq, asc, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const GetAllProjects = async () => {
    try {
        const { db } = await getTenantDbForRequest();

        const project = await db.query.projects.findMany({
            where: (p, { eq }) => eq(p.isDeleted, false),
            with: {
                plots: {
                    where: (pl, { eq }) => eq(pl.isDeleted, false),
                    orderBy: (pl, { asc }) => [asc(pl.plotNumber)],
                },
            },
        });

        if (!project) {
            return { success: false, error: "Project not found" };
        }

        return { success: true, data: project };
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
        const { userId } = await auth();

        const rowsWithAddedBy: NewProject[] = rows.map((r) => ({
            ...r,
            // Always attribute the import to the current user when available.
            // (If unauthenticated, keep whatever is provided in the row.)
            addedBy: userId ?? r.addedBy,
        }));

        await db.insert(projects).values(rowsWithAddedBy);

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

const emptyToUndefinedString = z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().optional(),
);

// For edits we allow partial/relaxed updates so existing records that have blank fields
// can be saved without failing strict validations.
const UpdateProjectSchema = z.object({
    projectId: z.string().uuid(),

    // keep required fields required
    projectName: z.string().min(2),
    acquisitionDate: z.string().min(4),
    acquisitionValue: z.string().min(1),

    // relaxed / optional fields
    region: emptyToUndefinedString,
    district: emptyToUndefinedString,
    ward: emptyToUndefinedString,
    street: emptyToUndefinedString,
    sqmBought: emptyToUndefinedString,
    numberOfPlots: emptyToUndefinedString,
    projectOwner: emptyToUndefinedString,

    commitmentAmount: emptyToUndefinedString,
    supplierName: emptyToUndefinedString,

    tpStatus: emptyToUndefinedString,
    tpNumber: emptyToUndefinedString,
    surveyStatus: emptyToUndefinedString,
    surveyNumber: emptyToUndefinedString,

    mwenyekitiName: emptyToUndefinedString,
    mwenyekitiMobile: emptyToUndefinedString,
    mtendajiName: emptyToUndefinedString,
    mtendajiMobile: emptyToUndefinedString,
    localGovtFee: emptyToUndefinedString,
});

type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

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
    // Normalize to YYYY-MM-DD WITHOUT timezone shifting.
    // - If already YYYY-MM-DD, keep as-is.
    // - If a datetime/other format, convert using *local* calendar components.
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
    }

    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) {
        return trimmed;
    }

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function isUuid(v: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function isLikelyUrl(v: string | null | undefined): v is string {
    if (!v) return false;
    return /^https?:\/\//i.test(v);
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

        const numberOfPlotsInt = Number.parseInt(input.numberOfPlots, 10);
        if (!Number.isFinite(numberOfPlotsInt)) {
            return { success: false, error: "Invalid number of plots" } as const;
        }

        // Generate an id up-front so we can namespace uploads under the project.
        const projectId = crypto.randomUUID();

        // Upload docs to a PRIVATE R2 bucket and store only the object keys in the DB.
        const originalContract = getFile(formData, "originalContract");
        const tpDocument = getFile(formData, "tpDocument");
        const surveyDocument = getFile(formData, "surveyDocument");

        const [contractUpload, tpUpload, surveyUpload] = await Promise.all([
            originalContract
                ? uploadPdfToR2({
                    file: originalContract,
                    folder: "Contracts",
                    projectId,
                    namePrefix: `${input.projectName}-contract`,
                })
                : Promise.resolve(undefined),
            tpDocument
                ? uploadPdfToR2({
                    file: tpDocument,
                    folder: "Town plans",
                    projectId,
                    namePrefix: `${input.projectName}-tp`,
                })
                : Promise.resolve(undefined),
            surveyDocument
                ? uploadPdfToR2({
                    file: surveyDocument,
                    folder: "Survey Plans",
                    projectId,
                    namePrefix: `${input.projectName}-survey`,
                })
                : Promise.resolve(undefined),
        ]);

        // supplier_name is currently a UUID in the schema. If the UI provides a plain name,
        // store it in projectDetails so it is not lost.
        const supplierAsUuid = isUuid(input.supplierName) ? input.supplierName : undefined;
        const supplierNameText = supplierAsUuid ? undefined : input.supplierName;

        const row: NewProject = {
            id: projectId,
            projectName: input.projectName,
            acquisitionDate: toDateOnlyString(input.acquisitionDate),
            acquisitionValue: input.acquisitionValue,

            region: input.region,
            district: input.district,
            ward: input.ward,
            street: input.street,
            sqmBought: input.sqmBought,
            numberOfPlots: numberOfPlotsInt,
            projectOwner: input.projectOwner,

            committmentAmount: input.commitmentAmount,
            supplierName: supplierAsUuid,
            projectDetails: supplierNameText ? `Supplier: ${supplierNameText}` : undefined,

            tpStatus: input.tpStatus,
            tpNumber: input.tpNumber,
            surveyStatus: input.surveyStatus,
            surveyNumber: input.surveyNumber,

            // Store R2 object keys (private). Use presigned URLs when serving to clients.
            originalContractPdf: contractUpload?.key,
            tpUrl: tpUpload?.key,
            surveyUrl: surveyUpload?.key,

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

export async function UpdateProject(formData: FormData) {
    try {
        const { db } = await getTenantDbForRequest();

        const raw: Partial<UpdateProjectInput> = {
            projectId: getString(formData, "projectId"),

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

        const parsed = UpdateProjectSchema.safeParse(raw);
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues.map((i) => i.message).join(", "),
            } as const;
        }

        const input = parsed.data;

        const existing = await db
            .select()
            .from(projects)
            .where(eq(projects.id, input.projectId))
            .limit(1);

        const current = existing[0];
        if (!current) {
            return { success: false, error: "Project not found" } as const;
        }

        const nextNumberOfPlots =
            input.numberOfPlots != null
                ? Number.parseInt(input.numberOfPlots, 10)
                : current.numberOfPlots;

        if (input.numberOfPlots != null && !Number.isFinite(nextNumberOfPlots)) {
            return { success: false, error: "Invalid number of plots" } as const;
        }

        // Optional doc replacements
        const originalContract = getFile(formData, "originalContract");
        const tpDocument = getFile(formData, "tpDocument");
        const surveyDocument = getFile(formData, "surveyDocument");

        const allowedDocTypes = ["application/pdf"] as const;

        const [contractUpload, tpUpload, surveyUpload] = await Promise.all([
            originalContract
                ? uploadPdfToR2({
                    file: originalContract,
                    folder: "Contracts",
                    projectId: input.projectId,
                    namePrefix: `${input.projectName}-contract`,
                })
                : Promise.resolve(undefined),
            tpDocument
                ? uploadPdfToR2({
                    file: tpDocument,
                    folder: "Town plans",
                    projectId: input.projectId,
                    namePrefix: `${input.projectName}-tp`,
                })
                : Promise.resolve(undefined),
            surveyDocument
                ? uploadPdfToR2({
                    file: surveyDocument,
                    folder: "Survey Plans",
                    projectId: input.projectId,
                    namePrefix: `${input.projectName}-survey`,
                })
                : Promise.resolve(undefined),
        ]);

        // supplier_name is currently a UUID in the schema. If the UI provides a plain name,
        // keep it in projectDetails without clobbering existing details.
        const supplierAsUuid =
            input.supplierName && isUuid(input.supplierName) ? input.supplierName : undefined;
        const supplierNameText = supplierAsUuid ? undefined : input.supplierName;

        const nextDetails = supplierNameText
            ? current.projectDetails
                ? `${current.projectDetails}\nSupplier: ${supplierNameText}`
                : `Supplier: ${supplierNameText}`
            : current.projectDetails;

        const prevContractKey = current.originalContractPdf;
        const prevTpKey = current.tpUrl;
        const prevSurveyKey = current.surveyUrl;

        const updated = await db
            .update(projects)
            .set({
                projectName: input.projectName,
                acquisitionDate: toDateOnlyString(input.acquisitionDate),
                acquisitionValue: input.acquisitionValue,

                region: input.region ?? current.region,
                district: input.district ?? current.district,
                ward: input.ward ?? current.ward,
                street: input.street ?? current.street,
                sqmBought: input.sqmBought ?? current.sqmBought,
                numberOfPlots: nextNumberOfPlots,
                projectOwner: input.projectOwner ?? current.projectOwner,

                committmentAmount: input.commitmentAmount ?? current.committmentAmount,
                supplierName: supplierAsUuid ?? current.supplierName,
                projectDetails: nextDetails,

                tpStatus: input.tpStatus ?? current.tpStatus,
                tpNumber: input.tpNumber ?? current.tpNumber,
                surveyStatus: input.surveyStatus ?? current.surveyStatus,
                surveyNumber: input.surveyNumber ?? current.surveyNumber,

                originalContractPdf: contractUpload?.key ?? current.originalContractPdf,
                tpUrl: tpUpload?.key ?? current.tpUrl,
                surveyUrl: surveyUpload?.key ?? current.surveyUrl,

                mwenyekitiName: input.mwenyekitiName ?? current.mwenyekitiName,
                mwenyekitiMobile: input.mwenyekitiMobile ?? current.mwenyekitiMobile,
                mtendajiName: input.mtendajiName ?? current.mtendajiName,
                mtendajiMobile: input.mtendajiMobile ?? current.mtendajiMobile,
                lgaFee: input.localGovtFee ?? current.lgaFee,

                updatedAt: new Date(),
            })
            .where(eq(projects.id, input.projectId))
            .returning();

        // Best-effort cleanup: if a document was replaced, delete the old object.
        // (Do this after DB update so we don't lose the only reference if update fails.)
        try {
            if (
                contractUpload?.key &&
                prevContractKey &&
                prevContractKey !== contractUpload.key &&
                !isLikelyUrl(prevContractKey)
            ) {
                await deleteR2Object(prevContractKey);
            }
            if (
                tpUpload?.key &&
                prevTpKey &&
                prevTpKey !== tpUpload.key &&
                !isLikelyUrl(prevTpKey)
            ) {
                await deleteR2Object(prevTpKey);
            }
            if (
                surveyUpload?.key &&
                prevSurveyKey &&
                prevSurveyKey !== surveyUpload.key &&
                !isLikelyUrl(prevSurveyKey)
            ) {
                await deleteR2Object(prevSurveyKey);
            }
        } catch (e) {
            console.warn("R2 cleanup failed", e);
        }

        revalidatePath("/projects");

        return { success: true, data: updated[0] } as const;
    } catch (error) {
        console.error("UpdateProject failed", error);
        return {
            success: false,
            error:
                error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
                    ? "Unauthorized"
                    : error instanceof Error
                        ? error.message
                        : "Failed to update project",
        } as const;
    }
}

const GetProjectDocumentUrlSchema = z.object({
    projectId: z.string().uuid(),
    doc: z.enum(["contract", "tp", "survey"]),
    expiresInSeconds: z.number().int().min(30).max(60 * 30).optional(),
});

export async function GetProjectDocumentUrl(input: z.infer<typeof GetProjectDocumentUrlSchema>) {
    try {
        const parsed = GetProjectDocumentUrlSchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: "Invalid request" } as const;
        }

        const { db } = await getTenantDbForRequest();

        const row = await db
            .select({
                id: projects.id,
                originalContractPdf: projects.originalContractPdf,
                tpUrl: projects.tpUrl,
                surveyUrl: projects.surveyUrl,
            })
            .from(projects)
            .where(eq(projects.id, parsed.data.projectId))
            .limit(1);

        const project = row[0];
        if (!project) {
            return { success: false, error: "Project not found" } as const;
        }

        const key =
            parsed.data.doc === "contract"
                ? project.originalContractPdf
                : parsed.data.doc === "tp"
                    ? project.tpUrl
                    : project.surveyUrl;

        if (!key) {
            return { success: false, error: "Document not available" } as const;
        }

        // Backwards compatibility: if old Cloudinary URLs exist in DB, return as-is.
        if (isLikelyUrl(key)) {
            return { success: true, data: { url: key } } as const;
        }

        const url = await getPresignedGetUrl({
            key,
            expiresInSeconds: parsed.data.expiresInSeconds ?? 60 * 5,
        });

        return { success: true, data: { url } } as const;
    } catch (error) {
        console.error("GetProjectDocumentUrl failed", error);
        return {
            success: false,
            error:
                error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
                    ? "Unauthorized"
                    : error instanceof Error
                        ? error.message
                        : "Failed to generate download URL",
        } as const;
    }
}
