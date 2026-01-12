"use client"

import {OrganizationSwitcher} from "@clerk/nextjs";
import {Bell, MessagesSquare, Palette, Settings, Wallet2} from "lucide-react";
import SMSPricingCalculator from "@/components/forms/sms/purchase-form";
import {SettingsPage} from "@/components/settings-page";

const ClerkOrganizationManager = ({ orgName, settingsData } : { orgName: string | undefined , settingsData: { slogan: string, mobile: string, email: string, color: string, address: string} | undefined }) =>{

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
                    <SettingsPage initialValues={settingsData} />
                </OrganizationSwitcher.OrganizationProfilePage>
                <OrganizationSwitcher.OrganizationProfilePage
                    label="SMS Recharge"
                    url="sms-recharge"
                    labelIcon={<MessagesSquare className="size-4.5"/>}
                >
                    <SMSPricingCalculator tenantName={orgName}/>
                </OrganizationSwitcher.OrganizationProfilePage>

            </OrganizationSwitcher>
    )
}

export default ClerkOrganizationManager;