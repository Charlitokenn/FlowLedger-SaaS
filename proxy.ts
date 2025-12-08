import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
    '/auth/callback',
]);

const isOnboardingRoute = createRouteMatcher([
    '/select-organization',
    '/onboarding(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
    const url = req.nextUrl;
    const hostname = req.headers.get('host') || '';
    const subdomain = hostname.split('.')[0];

    // Allow public routes
    if (isPublicRoute(req)) {
        return NextResponse.next();
    }

    // Get auth data (Clerk v6 - async)
    const authData = await auth();

    // Require authentication
    if (!authData.userId) {
        const signInUrl = new URL('/sign-in', url);
        signInUrl.searchParams.set('redirect_url', url.toString());
        return NextResponse.redirect(signInUrl);
    }

    // Allow onboarding routes
    if (isOnboardingRoute(req)) {
        return NextResponse.next();
    }

    // Require organization
    if (!authData.orgId || !authData.orgSlug) {
        const selectOrgUrl = new URL('/select-organization', url);
        selectOrgUrl.searchParams.set('redirect_url', url.toString());
        return NextResponse.redirect(selectOrgUrl);
    }

    // Development: Allow any subdomain
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set('x-clerk-org-id', authData.orgId);
        requestHeaders.set('x-clerk-org-slug', authData.orgSlug);
        requestHeaders.set('x-clerk-org-role', authData.orgRole || 'member');

        return NextResponse.next({
            request: { headers: requestHeaders },
        });
    }

    // Production: Enforce subdomain routing
    const baseHost = hostname.split('.').slice(1).join('.');

    // Redirect from wrong subdomain
    if (subdomain !== authData.orgSlug && subdomain !== 'app') {
        const correctUrl = new URL(url);
        correctUrl.hostname = `${authData.orgSlug}.${baseHost}`;
        return NextResponse.redirect(correctUrl);
    }

    // Redirect from app.domain.com to org subdomain
    if (subdomain === 'app') {
        const orgUrl = new URL(url);
        orgUrl.hostname = `${authData.orgSlug}.${baseHost}`;
        return NextResponse.redirect(orgUrl);
    }

    // Add tenant context headers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-clerk-org-id', authData.orgId);
    requestHeaders.set('x-clerk-org-slug', authData.orgSlug);
    requestHeaders.set('x-clerk-org-role', authData.orgRole || 'member');

    return NextResponse.next({
        request: { headers: requestHeaders },
    });
}, {
    authorizedParties: [
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        `https://*.${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost'}`,
    ],
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};