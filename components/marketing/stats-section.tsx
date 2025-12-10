"use client";

import { Section } from "./section";

interface StatProps {
  label: string;
  value: string;
  description: string;
}

function StatCard({ label, value, description }: StatProps) {
  return (
    <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-border">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        {label}
      </p>
      <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function StatsSection() {
  return (
    <Section id="stats">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Global SMEs trust FlowLedger
          </h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Whether you&apos;re a freelancer, agency, or growing startup, FlowLedger
            gives you the foundation to manage bookkeeping with confidence.
          </p>
          <p className="text-xs text-muted-foreground">
            Simple pricing for teams of every size. Start for free and scale as you grow.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Countries"
            value="100+"
            description="Businesses around the world rely on FlowLedger for everyday bookkeeping."
          />
          <StatCard
            label="Users"
            value="30K+"
            description="From solo founders to finance teams, everyone stays aligned on the numbers."
          />
          <StatCard
            label="Invoices sent"
            value="10M+"
            description="Create, send, and reconcile invoices with just a few clicks."
          />
          <StatCard
            label="Support"
            value="24/7"
            description="Friendly, human support when you need it, wherever you&apos;re located."
          />
        </div>
      </div>
    </Section>
  );
}
