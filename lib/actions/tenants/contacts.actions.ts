"use server";

import {contacts, type NewContact, type NewProject, projects} from "@/database/tenant-schema";
import { getTenantDbForRequest, MISSING_TENANT_CONTEXT_ERROR } from "@/lib/tenant-context";
import { revalidatePath } from "next/cache";
import {inArray} from "drizzle-orm";
import {auth} from "@clerk/nextjs/server";
import crypto from "crypto";
import {uploadPdfToR2} from "@/lib/r2/r2.server";

export const GetAllContacts = async () => {
  try {
    const { db } = await getTenantDbForRequest();

    const contact = await db.query.contacts.findMany({
      where: (p, { eq }) => eq(p.isDeleted, false),
      orderBy: (p, { desc }) => [desc(p.fullName)],
      with: {
          plots: true,
          plotSaleContracts: true,
      },
    });

    if (!contact) {
      return { success: false, error: "Contact not found" };
    }

    return { success: true, data: contact };
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return {
      success: false,
      error:
          error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
              ? "Unauthorized"
              : error instanceof Error
                  ? error.message
                  : "Failed to fetch contacts",
    };
  }
};

export async function CreateContact(formData: FormData) {
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

    const inserted = await db.insert(contacts).values(row).returning();

    revalidatePath("/contacts");

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

export const SoftDeleteContacts = async (ids: string[]) => {
  try {
    const { db } = await getTenantDbForRequest();

    const results = await db
        .update(contacts)
        .set({ isDeleted: true })
        .where(inArray(contacts.id, ids))
        .returning();
    // Revalidate the contacts page route so deleted records disappear
    revalidatePath("/contacts");

    return { success: true, data: results };

  } catch (error) {
    console.error("Error deleting contact:", error);
    return {
      success: false,
      error:
          error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
              ? "Unauthorized"
              : error instanceof Error
                  ? error.message
                  : "Failed to delete contact",
    };
  }
};

export async function BulkImportContacts(rows: NewContact[]) {
  try {
    if (!rows.length) {
      return { success: true, inserted: 0 };
    }

    const { db } = await getTenantDbForRequest();

    await db.insert(contacts).values(rows);

    // Revalidate contacts table/page once import completes.
    revalidatePath("/contacts");

    return { success: true, inserted: rows.length };
  } catch (error) {
    console.error("Bulk import contacts failed", error);
    return {
      success: false,
      error:
        error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
          ? "Unauthorized"
          : error instanceof Error
            ? error.message
            : "Failed to import contacts",
    } as const;
  }
}

export async function GetContactsForContracts(): Promise<
  | { success: true; data: { id: string; fullName: string }[] }
  | { success: false; error: string }
> {
  try {
    const { db } = await getTenantDbForRequest();

    const rows = await db.select({ id: contacts.id, fullName: contacts.fullName }).from(contacts);

    return {
      success: true,
      data: rows.map((r) => ({ id: String(r.id), fullName: String(r.fullName ?? "") })),
    };
  } catch (error) {
    console.error("GetContactsForContracts failed", error);
    return {
      success: false,
      error:
        error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
          ? "Unauthorized"
          : error instanceof Error
            ? error.message
            : "Failed to fetch contacts",
    };
  }
}


