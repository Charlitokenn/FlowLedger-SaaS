"use client";

import { Section } from "./section";

interface FeatureCardProps {
  title: string;
  description: string;
}

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-border">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <Section id="features" muted>
      <div className="space-y-16">
        {/* Free Bookkeeping */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Free bookkeeping software for SMEs
          </h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            From invoicing to expense tracking to reporting, FlowLedger has all the tools
            you need to manage your money online.
          </p>
        </div>

        {/* Three feature cards (Free, Online, Open Source) */}
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            title="Free"
            description="Start with powerful free features. Upgrade only when you're ready to automate more of your workflow."
          />
          <FeatureCard
            title="Online"
            description="Access your finances anytime, anywhere. Collaborate with your accountant, partners, and team members."
          />
          <FeatureCard
            title="Secure"
            description="Enterprise-grade security, role-based access, and detailed audit logs keep your data safe and compliant."
          />
        </div>

        {/* Feature rich grid */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground">Feature rich</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything you need to manage your web accounting. Keep track of income,
              expenses, and clients in one place.
            </p>
          </div>

          <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2 md:grid-cols-4">
            <div>
              <p className="font-semibold">Cash Flow</p>
              <p className="mt-1 text-xs text-slate-600">
                Stay on top of your cash flow and make smarter decisions about your
                business.
              </p>
            </div>
            <div>
              <p className="font-semibold">Expense Tracking</p>
              <p className="mt-1 text-xs text-slate-600">
                Track expenses by category, project, and client so nothing slips
                through the cracks.
              </p>
            </div>
            <div>
              <p className="font-semibold">Easy Invoicing</p>
              <p className="mt-1 text-xs text-slate-600">
                Create beautiful invoices in seconds and get paid faster with online
                payments.
              </p>
            </div>
            <div>
              <p className="font-semibold">Categories &amp; Tags</p>
              <p className="mt-1 text-xs text-slate-600">
                Organize income and expenses into flexible categories that mirror how
                your business actually works.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
