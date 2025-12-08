import PageHero from "@/components/ui/pageHero";
import { getPersonalizedGreeting } from "@/lib/greetings";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        template: "%s | FlowLedger",
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
                type="hero"
                title={greeting}
                subtitle="Track and manage your financial obligations at a glance"
                showButton={true}
                buttonText="Create Reminder"
                sheetContent={undefined}
                sheetTitle={""}
            />
        </section>
    )
}

export default DashboardPage