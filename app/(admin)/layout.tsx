import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { TenantContextProvider } from "../../lib/context-provider";
import config from "@/lib/config/app-config";
import { AdminSidebar } from "@/components/ui/admin-sidebar";

export default async function TenantLayout({
    children, params
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ slug?: string }>;
}>) {
    const { sessionClaims } = await auth();
    const isAdmin = sessionClaims?.o?.rol === 'admin' || sessionClaims?.o?.rol === 'super_admin';
    const localhost = config.env.apiEndpoint

    return (
        <SidebarProvider>
            <AdminSidebar
                userName={sessionClaims?.firstName}
                logo={sessionClaims?.orgLogo}
                orgName={sessionClaims?.orgName}
                role={sessionClaims?.o?.rol}
            />
            <SidebarInset>
                <header className="flex h-12 shrink-0 items-center gap-2 border-b sticky top-0 z-50 bg-background">
                    <div className="flex flex-1 items-center gap-2 px-8">
                        <SidebarTrigger className="-ms-4" />
                    </div>
                    <div className="flex gap-3 ml-auto px-6">
                        {isAdmin && <OrganizationSwitcher hidePersonal afterSelectOrganizationUrl={`${sessionClaims.o.slg}.${localhost}`} />}
                        <UserButton />
                    </div>
                </header>

                <div className="flex flex-1 flex-col p-6 gap-4 lg:gap-6">
                    <TenantContextProvider sessionClaims={sessionClaims}>
                        {children}
                    </TenantContextProvider>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
