import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function AuthCallbackPage() {
    const authData = await auth();

    if (!authData.userId) {
        redirect('/sign-in');
    }

    try {
        const client = await clerkClient();

        // Get user's organizations
        const { data: memberships } = await client.users.getOrganizationMembershipList({
            userId: authData.userId,
        });

        // Case 1: No organizations
        if (memberships.length === 0) {
            redirect('/onboarding/create-organization');
        }

        // Case 2: Single organization
        if (memberships.length === 1) {
            const orgSlug = memberships[0].organization.slug;
            const redirectUrl = getOrganizationUrl(orgSlug);
            redirect(redirectUrl);
        }

        // Case 3: Multiple organizations
        redirect('/select-organization');
    } catch (error) {
        console.error('Auth callback error:', error);
        redirect('/sign-in');
    }
}

function getOrganizationUrl(orgSlug: string | null, path: string = '/dashboard'): string {
    if (!orgSlug) {
        return path;
    }

    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        return `${path}?org=${orgSlug}`;
    }

    const baseHost = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost';
    return `https://${orgSlug}.${baseHost}${path}`;
}
