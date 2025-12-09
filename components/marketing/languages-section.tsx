"use client";

import { Section } from "./section";

export function LanguagesSection() {
  return (
    <>
      <Section muted>
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Available in 50+ languages
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              FlowLedger is translated into dozens of languages by a global
              community of contributors. Wherever you run your business, your team
              can work in the language that feels natural.
            </p>
            <p className="text-xs text-slate-500">
              Choose your language when you create your organization, or switch at
              any time from your profile settings.
            </p>
          </div>

          <div className="relative h-48 rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-6 text-primary-foreground shadow-xl">
            <div className="space-y-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">
                Multilingual by design
              </p>
              <p className="text-lg font-semibold">Built for global teams</p>
              <p className="text-xs text-primary-foreground/80">
                Localize invoices, emails, and client-facing content with just a few
                clicks. Keep your numbers consistent while your language adapts.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Lightweight anchor for Blog section in the navbar */}
      <Section id="blog" muted>
        <div className="space-y-3 text-center">
          <h2 className="text-xl font-semibold text-foreground">From the blog</h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Learn practical tips on bookkeeping, cash flow management, and growing
            a modern SME. Our blog showcases real-world playbooks from teams using
            FlowLedger every day.
          </p>
        </div>
      </Section>
    </>
  );
}
