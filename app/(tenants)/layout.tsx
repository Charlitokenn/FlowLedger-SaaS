import { TenantSidebar } from "@/components/ui/tenant-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { protocol, rootDomain } from "@/lib/utils";
import type { SessionClaims } from "@/types/auth";
import { Settings } from "lucide-react";

export default async function TenantLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { sessionClaims } = await auth();
    const claims = sessionClaims as SessionClaims | null;

    if (!claims) {
        redirect('/sign-in');
    }

    const isAdmin = claims?.o?.rol === 'admin' || claims?.o?.rol === 'super_admin';

    return (
        <SidebarProvider>
            <TenantSidebar
                userName={claims?.firstName as string | undefined}
                logo={claims?.orgLogo as string | undefined}
                orgName={claims?.orgName as string | undefined}
                role={(claims?.o as { rol?: string })?.rol as string | undefined}
            />
            <SidebarInset>
                <header className="flex h-12 shrink-0 items-center gap-2 border-b sticky top-0 z-50 bg-background">
                    <div className="flex flex-1 items-center gap-2 px-8">
                        <SidebarTrigger className="-ms-4" />
                    </div>
                    <div className="flex gap-3 ml-auto px-6">
                        {isAdmin &&
                            <OrganizationSwitcher
                                hidePersonal
                                afterSelectOrganizationUrl="/dashboard"
                            >
                                <OrganizationSwitcher.OrganizationProfilePage
                                    label="Custom Page"
                                    url="custom"
                                    labelIcon={<Settings />}
                                >
                                    <div>Hello There</div>
                                </OrganizationSwitcher.OrganizationProfilePage>
                            </OrganizationSwitcher>
                        }
                        <UserButton afterSignOutUrl={`${protocol}://${rootDomain}`} />
                    </div>
                </header>

                <div className="flex flex-1 flex-col p-6 gap-4 lg:gap-6">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
