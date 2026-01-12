"use server";

import {contacts, type NewContact} from "@/database/tenant-schema";
import { getTenantDbForRequest, MISSING_TENANT_CONTEXT_ERROR } from "@/lib/tenant-context";
import { revalidatePath } from "next/cache";
import {inArray, eq} from "drizzle-orm";
import {auth} from "@clerk/nextjs/server";
import { z } from "zod";

const CreateContactSchema = z.object({
  fullName: z.string().min(2, "Contact name must be at least 2 characters"),
  mobileNumber: z.string().min(12, "Enter a valid mobile number"),
  altMobileNumber: z.string().optional(),
  email: z.email().optional(),
  contactType: z.string().min(1, "Select contact type"),
  gender: z.string(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  ward: z.string().optional(),
  street: z.string().optional(),
  firstNOKName: z.string().optional(),
  firstNOKMobile: z.string().optional(),
  firstNOKRelationship: z.string().optional(),
  secondNOKName: z.string().optional(),
  secondNOKMobile: z.string().optional(),
  secondNOKRelationship: z.string().optional(),
});

type CreateContactInput = z.infer<typeof CreateContactSchema>;

function getString(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v === "string") return v;
  return undefined;
}

export const GetAllContacts = async () => {
  try {
    const { db } = await getTenantDbForRequest();

    const contacts = await db.query.contacts.findMany({
      where: (contact, { eq }) => eq(contact.isDeleted, false),
      orderBy: (contact, { desc }) => [desc(contact.fullName)],
      with: {
        plots: {
          columns: {
            id: true,
            plotNumber: true,
            unsurveyedSize: true,
            surveyedSize: true,
            surveyedPlotNumber: true,
          },
          with: {
            project: {
              columns: {
                projectName: true,
              },
            },

            // ✅ active (current) contract
            activeContract: {
              with: {
                installments: true,
                payments: true,
                events: true,
              }
            },

            // ✅ ALL contracts for this plot
            contracts: {
              with: {
                installments: true,
                payments: true,
                events: true,
              },
            },
          },
        },
      },
    });

    if (!contacts) {
      return { success: false, error: "Contact not found" };
    }

    // Post-process to add running totals to installments
    const contactsWithRunningTotals = contacts.map(contact => ({
      ...contact,
      plots: contact.plots.map(plot => ({
        ...plot,
        activeContract: plot.activeContract ? addRunningTotalToContract(plot.activeContract) : null,
        contracts: plot.contracts.map(contract => addRunningTotalToContract(contract)),
      })),
    }));

    return { success: true, data: contactsWithRunningTotals };
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

// Helper function to add running total (remaining balance) to contract installments
function addRunningTotalToContract<T extends {
  installments: any[];
  payments: any[];
  totalContractValue: string;
}>(contract: T) {
  if (!contract.installments || contract.installments.length === 0) {
    return contract;
  }

  // Sort installments by installment number
  const sortedInstallments = [...contract.installments].sort((a, b) =>
      a.installmentNo - b.installmentNo
  );

  const totalContractValue = Number(contract.totalContractValue);
  let totalPaid = 0;

  const installmentsWithRunningTotal = sortedInstallments.map(installment => {
    // Add the amount paid for this installment to the running total
    totalPaid += Number(installment.amountPaid);

    // Running total = remaining balance
    const runningTotal = totalContractValue - totalPaid;

    return {
      ...installment,
      runningTotal: runningTotal.toString(), // Remaining balance after this installment
    };
  });

  return {
    ...contract,
    installments: installmentsWithRunningTotal,
  };
}

export async function CreateContact(formData: FormData) {
  try {
    const { db } = await getTenantDbForRequest();
    const { userId } = await auth();

    const raw: Partial<CreateContactInput> = {
      // Contact details
      fullName: getString(formData, "fullName"),
      mobileNumber: getString(formData, "mobileNumber"),
      altMobileNumber: getString(formData, "altMobileNumber"),
      email: getString(formData, "email"),
      contactType: getString(formData, "contactType"),
      gender: getString(formData, "gender"),
      idType: getString(formData, "idType"),
      idNumber: getString(formData, "idNumber"),

      // Address details
      region: getString(formData, "region"),
      district: getString(formData, "district"),
      ward: getString(formData, "ward"),
      street: getString(formData, "street"),

      // Emergency contact details
      firstNOKName: getString(formData, "firstNOKName"),
      firstNOKMobile: getString(formData, "firstNOKMobile"),
      firstNOKRelationship: getString(formData, "firstNOKRelationship"),
      secondNOKName: getString(formData, "secondNOKName"),
      secondNOKMobile: getString(formData, "secondNOKMobile"),
      secondNOKRelationship: getString(formData, "secondNOKRelationship"),
    };

    const parsed = CreateContactSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      } as const;
    }

    const input = parsed.data;

    const row: NewContact = {
      fullName: input.fullName,
      mobileNumber: input.mobileNumber,
      altMobileNumber: input.altMobileNumber,
      email: input.email,
      contactType: input.contactType as any,
      gender: input.gender as any,
      idType: input.idType as any,
      idNumber: input.idNumber,
      region: input.region,
      district: input.district,
      ward: input.ward,
      street: input.street,
      firstNOKName: input.firstNOKName,
      firstNOKMobile: input.firstNOKMobile,
      firstNOKRelationship: input.firstNOKRelationship as any,
      secondNOKName: input.secondNOKName,
      secondNOKMobile: input.secondNOKMobile,
      secondNOKRelationship: input.secondNOKRelationship as any,
      addedBy: userId ?? undefined,
      isDeleted: false,
    };

    const inserted = await db.insert(contacts).values(row).returning();

    revalidatePath("/(tenants)/(contacts)");

    return { success: true, data: inserted[0] } as const;
  } catch (error) {
    console.error("CreateContact failed", error);
    return {
      success: false,
      error:
          error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
              ? "Unauthorized"
              : error instanceof Error
                  ? error.message
                  : "Failed to create contact",
    } as const;
  }
}

export async function UpdateContact(formData: FormData) {
  try {
    const { db } = await getTenantDbForRequest();

    const emptyToUndefined = z.preprocess((v) => (v === "" ? undefined : v), z.string().optional());

    const UpdateContactSchema = z.object({
      contactId: z.uuid(),

      fullName: z.string().min(2).optional(),
      mobileNumber: z.string().optional(),
      altMobileNumber: z.string().optional(),
      email: z.preprocess((v) => (v === "" ? undefined : v), z.email().optional()),
      contactType: emptyToUndefined,
      gender: emptyToUndefined,
      idType: emptyToUndefined,
      idNumber: z.string().optional(),

      region: z.string().optional(),
      district: z.string().optional(),
      ward: z.string().optional(),
      street: z.string().optional(),

      firstNOKName: z.string().optional(),
      firstNOKMobile: z.string().optional(),
      firstNOKRelationship: emptyToUndefined,
      secondNOKName: z.string().optional(),
      secondNOKMobile: z.string().optional(),
      secondNOKRelationship: emptyToUndefined,
    });

    function getString(formData: FormData, key: string): string | undefined {
      const v = formData.get(key);
      if (typeof v === "string") return v;
      return undefined;
    }

    const raw: Partial<z.infer<typeof UpdateContactSchema>> = {
      contactId: getString(formData, "contactId"),

      fullName: getString(formData, "fullName"),
      mobileNumber: getString(formData, "mobileNumber"),
      altMobileNumber: getString(formData, "altMobileNumber"),
      email: getString(formData, "email"),
      contactType: getString(formData, "contactType"),
      gender: getString(formData, "gender"),
      idType: getString(formData, "idType"),
      idNumber: getString(formData, "idNumber"),

      region: getString(formData, "region"),
      district: getString(formData, "district"),
      ward: getString(formData, "ward"),
      street: getString(formData, "street"),

      firstNOKName: getString(formData, "firstNOKName"),
      firstNOKMobile: getString(formData, "firstNOKMobile"),
      firstNOKRelationship: getString(formData, "firstNOKRelationship"),
      secondNOKName: getString(formData, "secondNOKName"),
      secondNOKMobile: getString(formData, "secondNOKMobile"),
      secondNOKRelationship: getString(formData, "secondNOKRelationship"),
    };

    const parsed = UpdateContactSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      } as const;
    }

    const input = parsed.data;

    // Fetch existing
    const existing = await db.select().from(contacts).where(eq(contacts.id, input.contactId)).limit(1);
    const current = existing[0];
    if (!current) {
      return { success: false, error: "Contact not found" } as const;
    }

    const updated = await db
      .update(contacts)
      .set({
        fullName: input.fullName ?? current.fullName,
        mobileNumber: input.mobileNumber ?? current.mobileNumber,
        altMobileNumber: input.altMobileNumber ?? current.altMobileNumber,
        email: input.email ?? current.email,
        contactType: (input.contactType as any) ?? current.contactType,
        gender: (input.gender as any) ?? current.gender,
        idType: (input.idType as any) ?? current.idType,
        idNumber: input.idNumber ?? current.idNumber,

        region: input.region ?? current.region,
        district: input.district ?? current.district,
        ward: input.ward ?? current.ward,
        street: input.street ?? current.street,

        firstNOKName: input.firstNOKName ?? current.firstNOKName,
        firstNOKMobile: input.firstNOKMobile ?? current.firstNOKMobile,
        firstNOKRelationship: (input.firstNOKRelationship as any) ?? current.firstNOKRelationship,
        secondNOKName: input.secondNOKName ?? current.secondNOKName,
        secondNOKMobile: input.secondNOKMobile ?? current.secondNOKMobile,
        secondNOKRelationship: (input.secondNOKRelationship as any) ?? current.secondNOKRelationship,

        updatedAt: new Date(),
      })
      .where(eq(contacts.id, input.contactId))
      .returning();

    revalidatePath("/contacts");

    return { success: true, data: updated[0] } as const;
  } catch (error) {
    console.error("UpdateContact failed", error);
    return {
      success: false,
      error:
        error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
          ? "Unauthorized"
          : error instanceof Error
            ? error.message
            : "Failed to update contact",
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
