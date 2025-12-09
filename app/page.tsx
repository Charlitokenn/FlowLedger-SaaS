import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { HeroSection } from '@/components/marketing/hero-section';
import { FeaturesSection } from '@/components/marketing/features-section';
import { ClientPortalSection } from '@/components/marketing/client-portal-section';
import { StatsSection } from '@/components/marketing/stats-section';
import { LanguagesSection } from '@/components/marketing/languages-section';
import { MarketingShell } from '@/components/marketing/marketing-shell';

export default async function HomePage() {
  const authData = await auth();

  if (authData.userId) {
    redirect('/auth/callback');
  }

  return (
    <MarketingShell>
      <HeroSection />
      <FeaturesSection />
      <ClientPortalSection />
      <StatsSection />
      <LanguagesSection />
    </MarketingShell>
  );
}
