import { CreateTenantForm } from '@/components/admin/create-tenant-form';
import { AddUserForm } from '@/components/admin/add-user-form';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CreateOrganization, OrganizationList, OrganizationSwitcher, SignOutButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import PageHero from '@/components/ui/pageHero';

export default async function AdminPage() {

  const { userId, sessionClaims, redirectToSignIn } = await auth();

  return (
    <section>
      <PageHero
        type="hero"
        title="Dashboard"
        subtitle={`Here you can view platforms performance`}
      />
    </section>
  );
}
