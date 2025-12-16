import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { catalogDb } from '@/database/drizzle-catalog';
import { tenants } from '@/database/catalog-schema';
import { eq } from 'drizzle-orm';
import { createTenantProject } from './neon-api';
import { setupTenantSchema } from './tenant-setup';
import * as schema from '@/database/tenant-schema';
import { encrypt, decrypt } from './encryption';

export type TenantDb = NeonHttpDatabase<typeof schema>;

// Connection cache to avoid recreating connections
const connectionCache = new Map<string, TenantDb>();

/**
 * Get or create tenant database connection
 * Implements Just-in-Time provisioning as fallback
 */
export async function getTenantDb(
    clerkOrgId: string,
    clerkOrgSlug: string,
    orgName: string
): Promise<TenantDb> {
    // Check cache first
    if (connectionCache.has(clerkOrgId)) {
        return connectionCache.get(clerkOrgId)!;
    }

    // Try to get tenant from catalog
    let [tenant] = await catalogDb
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, clerkOrgId))
        .limit(1);

    // Just-in-Time Provisioning: Create if doesn't exist
    if (!tenant) {
        console.log(`⚡ JIT provisioning for org: ${orgName} (${clerkOrgSlug})`);

        try {
            // Create Neon project
            const neonProject = await createTenantProject(clerkOrgSlug);

            // Run migrations
            await setupTenantSchema(neonProject.connectionString);

            // Encrypt connection string
            const encryptedConnectionString = encrypt(neonProject.connectionString);

            // Save to catalog
            [tenant] = await catalogDb
                .insert(tenants)
                .values({
                    id: clerkOrgId,
                    clerkOrgId: clerkOrgId,
                    clerkOrgSlug: clerkOrgSlug,
                    name: orgName,
                    neonProjectId: neonProject.projectId,
                    neonDatabaseName: neonProject.databaseName,
                    connectionString: encryptedConnectionString,
                    isActive: true,
                })
                .returning();

            console.log(`✅ JIT provisioning completed for ${orgName}`);
        } catch (error) {
            console.error('❌ JIT provisioning failed:', error);
            throw new Error(`Failed to provision tenant database: ${error}`);
        }
    }

    // Check if tenant is active
    if (!tenant.isActive) {
        throw new Error('Tenant is inactive. Please contact support.');
    }

    // Decrypt connection string
    const connectionString = decrypt(tenant.connectionString);

    // Create connection
    const sql = neon(connectionString);
    const db: TenantDb = drizzle(sql, { schema });

    // Cache it
    connectionCache.set(clerkOrgId, db);

    return db;
}

/**
 * Clear cache for specific tenant
 */
export function clearTenantCache(clerkOrgId: string): void {
    connectionCache.delete(clerkOrgId);
    console.log(`🗑️ Cleared cache for tenant: ${clerkOrgId}`);
}

/**
 * Clear all cached connections
 */
export function clearAllTenantCache(): void {
    connectionCache.clear();
    console.log('🗑️ Cleared all tenant cache');
}

/**
 * Get cached connection count (for monitoring)
 */
export function getCachedConnectionCount(): number {
    return connectionCache.size;
}