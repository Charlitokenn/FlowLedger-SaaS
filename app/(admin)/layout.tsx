import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { redirect } from "next/navigation";
import { protocol, rootDomain } from "@/lib/utils";

export default async function TenantLayout({
    children, params
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ slug?: string }>;
}>) {
    const { sessionClaims } = await auth();
    const claims = sessionClaims as SessionClaims | null;

    if (!claims) {
        //Redirect to login or show error
        redirect('/sign-in')
    }
    const isAdmin = claims?.o?.rol === 'admin' || claims?.o?.rol === 'super_admin';

    return (
        <SidebarProvider>
            <AdminSidebar
                userName={claims?.firstName}
                logo={claims?.orgLogo}
                orgName={claims?.orgName}
                role={claims?.o?.rol}
            />
            <SidebarInset>
                <header className="flex h-12 shrink-0 items-center gap-2 border-b sticky top-0 z-50 bg-background">
                    <div className="flex flex-1 items-center gap-2 px-8">
                        <SidebarTrigger className="-ms-4" />
                    </div>
                    <div className="flex gap-3 ml-auto px-6">
                        {isAdmin && claims?.o?.slg && <OrganizationSwitcher hidePersonal afterSelectOrganizationUrl="/admin" />}
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