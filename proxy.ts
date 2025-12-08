import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getHostnameParts } from './lib/host-utils';

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
]);

const isOnboardingRoute = createRouteMatcher([
    '/select-organization',
    '/onboarding(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
    const url = req.nextUrl;
    const { hostname, subdomain, baseHost } = getHostnameParts(req);

    // Allow public routes
    if (isPublicRoute(req)) {
        return NextResponse.next();
    }

    // Protect all non-public routes - this ensures auth is loaded
    await auth.protect();

    // Get auth data (Clerk v6 - async)
    const authData = await auth();

    // Derive role from custom session claims if available, falling back to orgRole.
    const sessionClaims: any = (authData as any).sessionClaims;
    const roleFromClaims: string | undefined = sessionClaims?.o?.rol;
    const effectiveRole = roleFromClaims || authData.orgRole || 'member';

    // Special case: platform super_admins on the admin subdomain
    // - Do NOT force them through select-organization
    // - Always land them on /admin instead of /dashboard or onboarding pages
    if (subdomain === 'admin' && effectiveRole === 'super_admin') {
        if (
            url.pathname === '/' ||
            url.pathname === '/dashboard' ||
            url.pathname === '/select-organization' ||
            url.pathname === '/auth/callback'
        ) {
            const adminUrl = new URL(url);
            adminUrl.pathname = '/admin';
            return NextResponse.redirect(adminUrl);
        }

        // Already on /admin or another admin route, just continue.
        return NextResponse.next();
    }

    // Allow onboarding routes for non-admin or non-super_admin users
    if (isOnboardingRoute(req)) {
        return NextResponse.next();
    }

    // Require organization for all other non-public routes
    if (!authData.orgId || !authData.orgSlug) {
        const selectOrgUrl = new URL('/select-organization', url);
        selectOrgUrl.searchParams.set('redirect_url', url.toString());
        return NextResponse.redirect(selectOrgUrl);
    }

    // Enforce host patterns for all environments (dev and prod)
    // Admin host: admin.<baseDomain>
    if (subdomain === 'admin') {
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set('x-clerk-org-id', authData.orgId);
        requestHeaders.set('x-clerk-org-slug', authData.orgSlug);
        requestHeaders.set('x-clerk-org-role', authData.orgRole || 'member');

        // Only super_admins can access the admin subdomain.
        if (effectiveRole !== 'super_admin') {
            const targetBaseHost = baseHost ?? hostname;
            const redirectUrl = new URL(url);
            redirectUrl.hostname = `${authData.orgSlug}.${targetBaseHost}`;
            redirectUrl.pathname = '/dashboard';
            return NextResponse.redirect(redirectUrl);
        }

        // Redirect root of admin host to /admin
        if (url.pathname === '/') {
            const adminUrl = new URL(url);
            adminUrl.pathname = '/admin';
            return NextResponse.redirect(adminUrl);
        }

        return NextResponse.next({
            request: { headers: requestHeaders },
        });
    }

    // Root marketing domain: <baseDomain>
    // For non-public app routes, redirect to the tenant subdomain
    if (!subdomain) {
        const redirectUrl = new URL(url);
        redirectUrl.hostname = `${authData.orgSlug}.${hostname}`;
        return NextResponse.redirect(redirectUrl);
    }

    // Tenant host: <orgSlug>.<baseDomain>
    if (subdomain !== authData.orgSlug) {
        const targetBaseHost = baseHost ?? hostname;
        const correctUrl = new URL(url);
        correctUrl.hostname = `${authData.orgSlug}.${targetBaseHost}`;
        return NextResponse.redirect(correctUrl);
    }

    // Correct tenant host: add tenant context headers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-clerk-org-id', authData.orgId);
    requestHeaders.set('x-clerk-org-slug', authData.orgSlug);
    requestHeaders.set('x-clerk-org-role', authData.orgRole || 'member');

    return NextResponse.next({
        request: { headers: requestHeaders },
    });
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};