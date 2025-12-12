"use server";

import { unstable_cache, revalidateTag } from "next/cache";
import { z } from "zod";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";

import { contacts, projects } from "@/database/tenant-schema";
import { getTenantDbForRequest, MISSING_TENANT_CONTEXT_ERROR } from "@/lib/tenant-context";

export type SelectOption = {
  value: string;
  label: string;
};

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const CACHE_TAG = "select-options";

const GetSelectOptionsInputSchema = z.discriminatedUnion("resource", [
  z.object({
    resource: z.literal("projects"),
    includeDeleted: z.boolean().optional(),
    limit: z.number().int().positive().max(1000).optional(),
    search: z.string().trim().min(1).max(200).optional(),
    order: z.enum(["label_asc", "label_desc", "created_desc"]).optional(),
    region: z.string().trim().min(1).max(100).optional(),
    district: z.string().trim().min(1).max(100).optional(),
  }),
  z.object({
    resource: z.literal("contacts"),
    includeDeleted: z.boolean().optional(),
    limit: z.number().int().positive().max(1000).optional(),
    search: z.string().trim().min(1).max(200).optional(),
    order: z.enum(["label_asc", "label_desc", "created_desc"]).optional(),
    contactType: z.string().trim().min(1).max(50).optional(),
    region: z.string().trim().min(1).max(100).optional(),
    district: z.string().trim().min(1).max(100).optional(),
  }),
]);

export type GetSelectOptionsInput = z.infer<typeof GetSelectOptionsInputSchema>;

function cacheKey(tenantId: string, input: GetSelectOptionsInput): string {
  // IMPORTANT: include tenant identity to avoid cross-tenant cache leaks.
  const stable = GetSelectOptionsInputSchema.parse(input);
  return [CACHE_TAG, tenantId, stable.resource, JSON.stringify(stable)].join(":");
}

function tagsFor(tenantId: string, resource: GetSelectOptionsInput["resource"]) {
  return [CACHE_TAG, `${CACHE_TAG}:${tenantId}`, `${CACHE_TAG}:${tenantId}:${resource}`];
}

async function fetchOptions(input: GetSelectOptionsInput): Promise<SelectOption[]> {
  const { db } = await getTenantDbForRequest();

  if (input.resource === "projects") {
    const includeDeleted = input.includeDeleted ?? false;
    const limit = input.limit ?? 200;

    const whereParts = [includeDeleted ? undefined : eq(projects.isDeleted, false)].filter(Boolean);

    if (input.region) whereParts.push(eq(projects.region, input.region));
    if (input.district) whereParts.push(eq(projects.district, input.district));

    if (input.search) {
      whereParts.push(
        or(
          ilike(projects.projectName, `%${input.search}%`),
          ilike(projects.projectDetails, `%${input.search}%`),
        ),
      );
    }

    const order = input.order ?? "label_asc";
    const orderBy =
      order === "created_desc"
        ? desc(projects.createdAt)
        : order === "label_desc"
          ? desc(projects.projectName)
          : asc(projects.projectName);

    const rows = await db
      .select({ value: projects.id, label: projects.projectName })
      .from(projects)
      .where(whereParts.length ? and(...whereParts) : undefined)
      .orderBy(orderBy)
      .limit(limit);

    return rows
      .map((r) => ({ value: String(r.value), label: String(r.label) }))
      .filter((o) => o.value && o.label);
  }

  // contacts
  const includeDeleted = input.includeDeleted ?? false;
  const limit = input.limit ?? 200;

  const whereParts = [includeDeleted ? undefined : eq(contacts.isDeleted, false)].filter(Boolean);

  if (input.contactType) whereParts.push(eq(contacts.contactType, input.contactType as any));
  if (input.region) whereParts.push(eq(contacts.region, input.region as any));
  if (input.district) whereParts.push(eq(contacts.district, input.district as any));

  if (input.search) {
    whereParts.push(
      or(
        ilike(contacts.fullName, `%${input.search}%`),
        ilike(contacts.mobileNumber, `%${input.search}%`),
        ilike(contacts.email, `%${input.search}%`),
      ),
    );
  }

  const order = input.order ?? "label_asc";
  const orderBy =
    order === "created_desc"
      ? desc(contacts.createdAt)
      : order === "label_desc"
        ? desc(contacts.fullName)
        : asc(contacts.fullName);

  const rows = await db
    .select({
      value: contacts.id,
      label: contacts.fullName,
      mobile: contacts.mobileNumber,
    })
    .from(contacts)
    .where(whereParts.length ? and(...whereParts) : undefined)
    .orderBy(orderBy)
    .limit(limit);

  return rows
    .map((r) => ({
      value: String(r.value),
      label: r.mobile ? `${String(r.label)} (${String(r.mobile)})` : String(r.label),
    }))
    .filter((o) => o.value && o.label);
}

/**
 * Get select options (tenant-safe) with caching.
 *
 * Intended usage: call this from server components (or from client via server action)
 * and feed the returned `data` into your form field options.
 */
export async function getSelectOptions(
  input: GetSelectOptionsInput,
  opts?: { cache?: { enabled?: boolean; revalidateSeconds?: number } },
): Promise<ActionResult<SelectOption[]>> {
  try {
    const parsed = GetSelectOptionsInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const validated = parsed.data;
    const { tenant } = await getTenantDbForRequest();

    const cacheEnabled = opts?.cache?.enabled !== false;
    const revalidate = opts?.cache?.revalidateSeconds ?? 60 * 5;

    if (!cacheEnabled) {
      const data = await fetchOptions(validated);
      return { success: true, data };
    }

    const cachedFetch = unstable_cache(
      () => fetchOptions(validated),
      [cacheKey(tenant.orgId, validated)],
      { revalidate, tags: tagsFor(tenant.orgId, validated.resource) },
    );

    const data = await cachedFetch();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
          ? "Unauthorized"
          : error instanceof Error
            ? error.message
            : "Failed to load select options",
    };
  }
}

/**
 * Cache invalidation helpers.
 * Note: Next 16's `revalidateTag` requires a 2nd argument.
 */
export async function revalidateSelectOptionsForTenant(tenantId: string) {
  revalidateTag(`${CACHE_TAG}:${tenantId}`, "default");
}

export async function revalidateSelectOptionsForTenantResource(
  tenantId: string,
  resource: GetSelectOptionsInput["resource"],
) {
  revalidateTag(`${CACHE_TAG}:${tenantId}:${resource}`, "default");
}

export async function revalidateAllSelectOptions() {
  revalidateTag(CACHE_TAG, "default");
}


//Example Use for server components
// import { getSelectOptions } from "@/lib/actions/tenants/select-options.actions";
// import { MyFormClient } from "./my-form-client";

// export default async function Page() {
//   const projectsRes = await getSelectOptions({ resource: "projects", limit: 500 });
//   const contactsRes = await getSelectOptions({ resource: "contacts", limit: 500 });

//   if (!projectsRes.success || !contactsRes.success) {
//     // handle error (show UI, etc.)
//   }

//   return (
//     <MyFormClient
//       projectOptions={projectsRes.success ? projectsRes.data : []}
//       contactOptions={contactsRes.success ? contactsRes.data : []}
//     />
//   );
// }

//Example Use for client side
// const res = await getSelectOptions({
//   resource: "contacts",
//   region: selectedRegion,
//   district: selectedDistrict,
//   limit: 500,
// });