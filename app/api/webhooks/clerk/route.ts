import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { tenants } from '@/database/catalog-schema';
import { createTenantProject, deleteTenantProject } from '@/lib/neon-api';
import { setupTenantSchema } from '@/lib/tenant-setup';
import { encrypt } from '@/lib/encryption';
import { eq } from 'drizzle-orm';
import { catalogDb } from '@/database/drizzle-catalog';

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.error('❌ CLERK_WEBHOOK_SECRET is not defined');
        return new Response('Server configuration error', { status: 500 });
    }

    // Get headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
        console.error('❌ Missing svix headers');
        return new Response('Missing svix headers', { status: 400 });
    }

    // Get body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Verify webhook signature
    const wh = new Webhook(WEBHOOK_SECRET);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let evt: any;

    try {
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as any;
    } catch (err) {
        console.error('❌ Webhook verification failed:', err);
        return new Response('Invalid signature', { status: 400 });
    }

    const eventType = evt.type;
    console.log(`📨 Webhook received: ${eventType}`);

    // Handle organization.created
    if (eventType === 'organization.created') {
        const { id, name, slug } = evt.data;

        try {
            console.log(`📦 Creating tenant: ${name} (${slug})`);

            // Check if tenant already exists
            const [existingTenant] = await catalogDb
                .select()
                .from(tenants)
                .where(eq(tenants.clerkOrgId, id))
                .limit(1);

            if (existingTenant) {
                console.log(`⚠️ Tenant already exists: ${name}`);
                return new Response(
                    JSON.stringify({ message: 'Tenant already exists' }),
                    { status: 200, headers: { 'Content-Type': 'application/json' } }
                );
            }

            // 1. Create Neon project
            const neonProject = await createTenantProject(slug);
            console.log(`✅ Neon project created: ${neonProject.projectId}`);

            // 2. Run migrations
            await setupTenantSchema(neonProject.connectionString);
            console.log(`✅ Schema migrated`);

            // 3. Encrypt connection string
            const encryptedConnectionString = encrypt(neonProject.connectionString);

            // 4. Save to catalog
            await catalogDb.insert(tenants).values({
                id: id,
                clerkOrgId: id,
                clerkOrgSlug: slug,
                name: name,
                neonProjectId: neonProject.projectId,
                neonDatabaseName: neonProject.databaseName,
                connectionString: encryptedConnectionString,
                isActive: true,
            });

            console.log(`✅ Tenant registered: ${name}`);

            return new Response(
                JSON.stringify({ success: true, tenantId: id }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            console.error('❌ Tenant creation failed:', error);

            // Return 500 to trigger Clerk webhook retry
            return new Response(
                JSON.stringify({
                    error: 'Tenant creation failed',
                    details: error instanceof Error ? error.message : String(error)
                }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // Handle organization.updated
    if (eventType === 'organization.updated') {
        const { id, name, slug } = evt.data;

        try {
            const [tenant] = await catalogDb
                .select()
                .from(tenants)
                .where(eq(tenants.clerkOrgId, id))
                .limit(1);

            if (tenant) {
                // Soft delete by default (recommended)
                await catalogDb
                    .update(tenants)
                    .set({
                        isActive: false,
                        updatedAt: new Date()
                    })
                    .where(eq(tenants.clerkOrgId, id));

                console.log(`✅ Tenant deactivated: ${tenant.name}`);

                // Optional: Hard delete (uncomment if needed)
                // await deleteTenantProject(tenant.neonProjectId);
                // await catalogDb.delete(tenants).where(eq(tenants.clerkOrgId, id));
            }

            return new Response(
                JSON.stringify({ success: true }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            console.error('❌ Tenant deletion failed:', error);
            return new Response(
                JSON.stringify({ error: 'Tenant deletion failed' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }
    return new Response(
        JSON.stringify({ message: 'Webhook processed' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
}