"use client";

import * as React from "react";
import { Section } from "../section";
import { cn } from "@/lib/utils";

export type PlanId = "starter" | "growth" | "scale";

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  ctaLabel: string;
  priceMonthly: string;
  priceYearly: string;
  popular?: boolean;
}

// Visual styling per plan so both the cards and comparison table stay in sync.
export const PLAN_STYLES: Record<PlanId, {
  columnBg: string; // light background tint used in tables
  headerAccent: string; // gradient for card top border
}> = {
  starter: {
    columnBg: "bg-emerald-50",
    headerAccent: "from-emerald-400 to-emerald-300",
  },
  growth: {
    columnBg: "bg-primary/10",
    headerAccent: "from-primary to-primary/80",
  },
  scale: {
    columnBg: "bg-sky-50",
    headerAccent: "from-sky-400 to-sky-300",
  },
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: "$0",
    priceYearly: "$0",
    description:
      "Best for freelancers and solo founders just getting started with bookkeeping.",
    ctaLabel: "Get Starter",
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthly: "$29",
    priceYearly: "$24",
    description:
      "For growing SMEs that need multi-user access, client portal, and reminders.",
    ctaLabel: "Go Growth",
    popular: true,
  },
  {
    id: "scale",
    name: "Scale",
    priceMonthly: "Talk to us",
    priceYearly: "Talk to us",
    description:
      "Larger teams that require custom limits, advanced permissions, and SLAs.",
    ctaLabel: "Contact sales",
  },
];

interface PricingPlansSectionProps {
  id?: string;
}

export function PricingPlansSection({ id }: PricingPlansSectionProps) {
  const [billingPeriod, setBillingPeriod] = React.useState<"monthly" | "yearly">(
    "monthly",
  );

  return (
    <Section id={id} muted>
      <div className="space-y-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Pricing
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Pick a plan that is right for you
          </h1>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            From solo founders to SMEs, FlowLedger has a plan that supports your
            bookkeeping today and scales with your business tomorrow.
          </p>
        </div>

        {/* Billing period toggle */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={cn(
                "rounded-full px-3 py-1",
                billingPeriod === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod("yearly")}
              className={cn(
                "rounded-full px-3 py-1",
                billingPeriod === "yearly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              <span>Yearly</span>
              <span className="ml-1 text-[10px] text-primary">Save 2 months</span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const styles = PLAN_STYLES[plan.id];
            const isContact =
              plan.priceMonthly === "Talk to us" ||
              plan.priceYearly === "Talk to us";

            const amount = isContact
              ? "Talk to us"
              : billingPeriod === "monthly"
              ? plan.priceMonthly
              : plan.priceYearly;

            const periodLabel = isContact
              ? "Custom pricing"
              : billingPeriod === "monthly"
              ? "per month"
              : "per year";

            return (
              <article
                key={plan.id}
                className={cn(
                  "relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border",
                  styles.columnBg,
                )}
              >
                {/* Colored strip at the top like the reference cards */}
                <div
                  className={cn(
                    "h-1 w-full bg-gradient-to-r",
                    styles.headerAccent,
                  )}
                />

                {plan.popular && (
                  <span className="absolute top-3 right-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                    Most popular
                  </span>
                )}

                <div className="flex flex-1 flex-col p-6">
                  <header className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {plan.id === "starter" && "Best for freelancers"}
                      {plan.id === "growth" && "For growing SMEs"}
                      {plan.id === "scale" && "For larger teams"}
                    </p>
                    <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
                    <div className="flex items-baseline gap-1 text-3xl font-bold text-foreground">
                      <span>{amount}</span>
                      {!isContact && (
                        <span className="text-xs font-normal text-muted-foreground">
                          / {periodLabel}
                        </span>
                      )}
                    </div>
                    {isContact && (
                      <p className="text-xs text-muted-foreground">{periodLabel}</p>
                    )}
                  </header>

                  <p className="mt-4 text-sm text-muted-foreground">
                    {plan.description}
                  </p>

                  <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
                    <li>• Unlimited invoices and expense tracking</li>
                    <li>• Real-time dashboard and basic reporting</li>
                    <li>• Secure cloud backups</li>
                  </ul>

                  <button
                    className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                  >
                    {plan.ctaLabel}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
