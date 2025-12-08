import { headers } from 'next/headers';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { getTenantDb } from '@/lib/tenant-db';

export type TenantContext = {
  orgId: string;
  orgSlug: string;
  orgRole: string | null;
  orgName: string;
};

const MISSING_TENANT_CONTEXT_ERROR = 'Tenant context is missing in request headers.';

/**
 * Read tenant context (org id / slug / role) from headers added by proxy.ts
 * and hydrate with organization name from Clerk.
 */
export async function requireTenantContext(): Promise<TenantContext> {
  const h = await headers();

  let orgId = h.get('x-clerk-org-id');
  let orgSlug = h.get('x-clerk-org-slug');
  let orgRole = h.get('x-clerk-org-role');

  // Fallback to Clerk auth() when headers are missing (e.g. during
  // server-side renders or internal server calls that don't go through proxy).
  if (!orgId || !orgSlug) {
    const authData = await auth();

    if (!authData.orgId || !authData.orgSlug) {
      throw new Error(MISSING_TENANT_CONTEXT_ERROR);
    }

    orgId = authData.orgId;
    orgSlug = authData.orgSlug;
    orgRole = authData.orgRole ?? orgRole;
  }

  const client = await clerkClient();
  const org = await client.organizations.getOrganization({
    organizationId: orgId!,
  });

  return {
    orgId: orgId!,
    orgSlug: orgSlug!,
    orgRole: orgRole ?? null,
    orgName: org.name,
  };
}

/**
 * Convenience helper for getting a tenant DB instance for the current request.
 */
export async function getTenantDbForRequest() {
  const tenant = await requireTenantContext();
  const db = await getTenantDb(tenant.orgId, tenant.orgSlug, tenant.orgName);
  return { db, tenant };
}

export { MISSING_TENANT_CONTEXT_ERROR };