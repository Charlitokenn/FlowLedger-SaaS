import { tenants } from '../db/catalog-schema';
import { setupTenantSchema } from '../lib/tenant-setup';
import { decrypt } from '../lib/encryption';
import { catalogDb } from '@/db/drizzle-catalog';

async function migrateAllTenants() {
    console.log('🚀 Starting migration for all tenants...\n');

    const allTenants = await catalogDb.select().from(tenants);

    console.log(`Found ${allTenants.length} tenants\n`);

    const results = {
        success: [] as string[],
        failed: [] as { name: string; error: string }[],
    };

    for (const tenant of allTenants) {
        try {
            console.log(`📦 Migrating: ${tenant.name} (${tenant.clerkOrgSlug})`);

            const connectionString = decrypt(tenant.connectionString);
            await setupTenantSchema(connectionString);

            console.log(`✅ Success: ${tenant.name}\n`);
            results.success.push(tenant.name);
        } catch (error) {
            console.error(`❌ Failed: ${tenant.name}`);
            console.error(error);
            console.log('');
            results.failed.push({
                name: tenant.name,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successful: ${results.success.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);

    if (results.failed.length > 0) {
        console.log('\n❌ Failed Migrations:');
        results.failed.forEach(({ name, error }) => {
            console.log(`  - ${name}: ${error}`);
        });
    }

    process.exit(results.failed.length > 0 ? 1 : 0);
}

migrateAllTenants();