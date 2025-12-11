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