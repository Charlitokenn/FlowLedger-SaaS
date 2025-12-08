import { auth, clerkClient } from '@clerk/nextjs/server';
import { tenants } from '@/db/catalog-schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { catalogDb } from '@/db/drizzle-catalog';

export default async function DashboardPage() {
    const authData = await auth();

    if (!authData.userId || !authData.orgId || !authData.orgSlug) {
        redirect('/select-organization');
    }

    const [tenant] = await catalogDb
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, authData.orgId))
        .limit(1);

    const client = await clerkClient();
    const org = await client.organizations.getOrganization({
        organizationId: authData.orgId,
    });

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-2 text-gray-600">Welcome to {org.name}</p>
            </div>

            {tenant && (
                <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-semibold">Organization Details</h2>
                    <dl className="grid grid-cols-2 gap-4">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Name</dt>
                            <dd className="mt-1 text-sm text-gray-900">{tenant.name}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Slug</dt>
                            <dd className="mt-1 text-sm text-gray-900">{tenant.clerkOrgSlug}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Region</dt>
                            <dd className="mt-1 text-sm text-gray-900">{tenant.region}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                            <dd className="mt-1">
                                {tenant.isActive ? (
                                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                                        Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                                        Inactive
                                    </span>
                                )}
                            </dd>
                        </div>
                    </dl>
                </div>
            )}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Link
                    href="/dashboard/posts"
                    className="group rounded-lg border bg-white p-6 shadow-sm transition hover:border-blue-500 hover:shadow-md"
                >
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                        Posts
                    </h3>
                    <p className="text-sm text-gray-600">Manage your posts</p>
                </Link>

                <Link
                    href="/dashboard/users"
                    className="group rounded-lg border bg-white p-6 shadow-sm transition hover:border-blue-500 hover:shadow-md"
                >
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                        Users
                    </h3>
                    <p className="text-sm text-gray-600">Manage members</p>
                </Link>

                <Link
                    href="/dashboard/settings"
                    className="group rounded-lg border bg-white p-6 shadow-sm transition hover:border-blue-500 hover:shadow-md"
                >
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                        Settings
                    </h3>
                    <p className="text-sm text-gray-600">Configure organization</p>
                </Link>
            </div>
        </div>
    );
}