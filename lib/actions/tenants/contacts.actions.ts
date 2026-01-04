"use server";

import { contacts, type NewContact } from "@/database/tenant-schema";
import { getTenantDbForRequest, MISSING_TENANT_CONTEXT_ERROR } from "@/lib/tenant-context";
import { revalidatePath } from "next/cache";

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
