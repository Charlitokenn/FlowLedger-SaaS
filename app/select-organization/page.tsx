import { OrganizationList } from '@clerk/nextjs';

export default function SelectOrganizationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <OrganizationList
        hidePersonal
        // After creating an organization, reuse the existing callback logic
        // to route the user to the correct org/subdomain.
        afterCreateOrganizationUrl="/auth/callback"
        // After selecting an organization, send the user to the dashboard.
        // The middleware in `proxy.ts` will enforce the correct subdomain in production
        // and use the `?org=` query param in development.
        afterSelectOrganizationUrl="/dashboard"
      />
    </div>
  );
}
