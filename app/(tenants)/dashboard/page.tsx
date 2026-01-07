import PageHero from "@/components/ui/pageHero";
import { getPersonalizedGreeting } from "@/lib/greetings";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import type { SessionClaims } from "@/types/auth";
import appConfig from "@/lib/app-config";
import {ContractsTableServer} from "@/components/test";

export const metadata: Metadata = {
    title: {
        template: `%s | ${appConfig.appDetails.brand}`,
        default: "Dashboard",
    },
};

const DashboardPage = async () => {
    const { sessionClaims } = await auth();
    const claims = sessionClaims as SessionClaims | null;

    const greeting = getPersonalizedGreeting(claims?.firstName);

    return (
        <section>
            <PageHero
                type="greeting"
                title={greeting}
                subtitle="Track and manage your financial obligations at a glance"
                showButton={false}
            />
        </section>
    );
};

export default DashboardPage