import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import OrganizationSelector from '@/components/organization-selector';

export default async function SelectOrganizationPage() {
  const authData = await auth();

  if (!authData.userId) {
    redirect('/sign-in');
  }

  const client = await clerkClient();
  
  const { data: memberships } = await client.users.getOrganizationMembershipList({
    userId: authData.userId,
  });

  if (memberships.length === 0) {
    redirect('/onboarding/create-organization');
  }

  if (memberships.length === 1) {
    const orgSlug = memberships[0].organization.slug;
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      redirect(`/dashboard?org=${orgSlug}`);
    }
    
    const baseHost = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost';
    redirect(`https://${orgSlug}.${baseHost}/dashboard`);
  }

  // Serialize memberships for Client Component
  const serializedOrgs = memberships.map(membership => ({
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    imageUrl: membership.organization.imageUrl,
    role: membership.role,
  }));

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <OrganizationSelector organizations={serializedOrgs} />
    </div>
  );
}