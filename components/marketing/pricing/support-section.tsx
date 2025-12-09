"use client";

import { Section } from "../section";

export function PricingSupportSection() {
  return (
    <Section muted>
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            Work with hands-on experts that support your business growth
          </h2>
          <p className="text-sm text-muted-foreground">
            Our team can help you import historical data, configure your chart of
            accounts, and train your staff so FlowLedger fits the way you already
            work.
          </p>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• Concierge onboarding for Growth and Scale plans</p>
          <p>• Email and chat support from real humans</p>
          <p>• Best-practice templates for invoices, expenses, and reports</p>
        </div>
      </div>
    </Section>
  );
}
