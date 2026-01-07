"use client"

import {OrganizationSwitcher} from "@clerk/nextjs";
import {Bell, MessageSquare, MessagesSquare, Settings, Wallet2} from "lucide-react";
import HorizontalTabs from "@/components/reusable components/reusable-horizontal-tabs";
import SMSPricingCalculator from "@/components/forms/sms/purchase-form";
import {MessageIcon} from "@/components/icons";

const ClerkOrganizationManager = ({ orgName } : { orgName: string | undefined}) =>{
    const tabsData: TabItem[] = [
        {
            value: "tab-1",
            label: "SMS Purchase",
            icon: MessagesSquare,
            content: (<SMSPricingCalculator tenantName={orgName}/>),
        },
        {
            value: "tab-2",
            label: "Subscription",
            icon: Wallet2,
            content: (
                <p className="p-4 text-center text-xs text-muted-foreground">
                    Content for Tab 1
                </p>
            ),
        },
        {
            value: "tab-3",
            label: "Notifications",
            icon: Bell,
            content: (
                <p className="p-4 text-center text-xs text-muted-foreground">
                    Content for Tab 3
                </p>
            ),
        },
    ]

    return (
            <OrganizationSwitcher
                hidePersonal
                afterSelectOrganizationUrl="/dashboard"
            >
                <OrganizationSwitcher.OrganizationProfilePage
                    label="Billing"
                    url="billing"
                    labelIcon={<Settings className="size-4.5"/>}
                >
                    <HorizontalTabs tabs={tabsData} />
                </OrganizationSwitcher.OrganizationProfilePage>
            </OrganizationSwitcher>
    )
}

export default ClerkOrganizationManager;