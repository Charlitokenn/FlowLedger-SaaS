import { FeaturesSection } from "@/components/marketing/features-section";
import { ClientPortalSection } from "@/components/marketing/client-portal-section";
import { StatsSection } from "@/components/marketing/stats-section";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <FeaturesSection />
      <ClientPortalSection />
      <StatsSection />
    </MarketingShell>
  );
}
