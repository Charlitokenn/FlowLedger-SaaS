import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PricingPlansSection } from "@/components/marketing/pricing/plans";
import { PricingFeatureTable } from "@/components/marketing/pricing/feature-table";
import { PricingSupportSection } from "@/components/marketing/pricing/support-section";
import { PricingFaqSection } from "@/components/marketing/pricing/faq-section";
import { StatsSection } from "@/components/marketing/stats-section";

export default function PricingPage() {
  return (
    <MarketingShell>
      <PricingPlansSection id="pricing" />
      <PricingSupportSection />
      <PricingFeatureTable />
      <StatsSection />
      <PricingFaqSection />
    </MarketingShell>
  );
}
