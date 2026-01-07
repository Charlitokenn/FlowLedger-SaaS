import { TenantSidebar } from "@/components/ui/tenant-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {protocol, rootDomain } from "@/lib/utils";
import type { SessionClaims } from "@/types/auth";
import {Badge} from "@/components/ui/badge";
import CountUp from "@/components/motion/count-up";
import ReusableTooltip from "@/components/reusable components/reusable-tooltip";
import React from "react";
import TenantNotificationsButton from "@/components/notifications-button";

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

    const gotNotifications = false

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
                    <div className="flex items-center gap-2 ml-auto px-6">
                        <Badge className="cursor-default border-0 bg-muted-foreground rounded-md dark:text-foreground dark:bg-accent">
                            SMS Balance:
                            <CountUp
                                from = {0}
                                to = {2205}
                                separator={","}
                            />
                        </Badge>
                        <ReusableTooltip
                            trigger={
                                <Badge className="hidden cursor-default border-0 bg-muted-foreground rounded-md dark:text-foreground dark:bg-accent">
                                    Credits:
                                    <CountUp
                                        from = {0}
                                        to = {1382}
                                        separator={","}
                                    />
                                </Badge>
                            }
                            tooltip="Credit Score Credits"
                        />
                        <TenantNotificationsButton/>
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
