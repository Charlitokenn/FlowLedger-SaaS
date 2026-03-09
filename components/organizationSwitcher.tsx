"use client"

import { OrganizationSwitcher } from "@clerk/nextjs";
import {MessagesSquare, Palette, Wallet, Wallet2} from "lucide-react";
import SMSPricingCalculator from "@/components/forms/sms/purchase-form";
import { SettingsPage } from "@/components/settings-page";
import React from "react";
import {BillingScreenDemo} from "@/components/billing-screen-demo";
import {SubscriptionManagementDemo} from "@/components/subscription-management-demo";

interface Props {
    orgName: string,
    settingsData: {
        slogan: string,
        mobile: string,
        email: string,
        color: string,
        address: string,
        website: string
    }
}

const ClerkOrganizationManager = ({ orgName, settingsData } : Props) =>{

    return (
            <OrganizationSwitcher
                hidePersonal
                afterSelectOrganizationUrl="/dashboard"
            >
                <OrganizationSwitcher.OrganizationProfilePage
                    label="Branding"
                    url="branding"
                    labelIcon={<Palette className="size-4.5"/>}
                >
                    <h1 className="font-bold">Branding</h1>
                    <SettingsPage key={orgName ?? "no-org"} initialValues={settingsData} />
                </OrganizationSwitcher.OrganizationProfilePage>
                <OrganizationSwitcher.OrganizationProfilePage
                    label="SMS Recharge"
                    url="sms-recharge"
                    labelIcon={<MessagesSquare className="size-4.5"/>}
                >
                    <h1 className="font-bold">SMS Recharge</h1>
                    <SMSPricingCalculator tenantName={orgName}/>
                </OrganizationSwitcher.OrganizationProfilePage>
                <OrganizationSwitcher.OrganizationProfilePage
                    label="Billing"
                    url="billing"
                    labelIcon={<Wallet2 className="size-4.5"/>}
                >
                    <h1 className="font-bold">Billing</h1>
                    <p>Test</p>
                </OrganizationSwitcher.OrganizationProfilePage>

            </OrganizationSwitcher>
    )
}

export default ClerkOrganizationManager;