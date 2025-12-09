import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Section } from "@/components/marketing/section";

export default function BlogPage() {
  return (
    <MarketingShell>
      <Section id="blog" muted>
        <div className="space-y-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              FlowLedger blog
            </h1>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Practical guides on cash flow management, bookkeeping best practices, and
              growing a healthy SME with modern tools.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <article className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Cash flow</p>
              <h2 className="mt-2 text-base font-semibold text-foreground">
                5 simple ways to make your cash flow more predictable
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Learn how recurring invoices, payment reminders, and aging reports work together
                to keep your runway steady.
              </p>
            </article>

            <article className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Automation</p>
              <h2 className="mt-2 text-base font-semibold text-foreground">
                Stop chasing payments with automated reminders
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Use FlowLedger's workflows to nudge clients at the right time—without
                adding more admin work to your week.
              </p>
            </article>

            <article className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Client portal</p>
              <h2 className="mt-2 text-base font-semibold text-foreground">
                Building trust with a transparent client portal
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                See how SMEs use client access to reduce back-and-forth emails and keep
                everyone aligned.
              </p>
            </article>
          </div>
        </div>
      </Section>
    </MarketingShell>
  );
}
