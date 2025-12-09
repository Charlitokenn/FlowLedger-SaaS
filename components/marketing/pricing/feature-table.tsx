"use client";

import { Section } from "../section";
import type { PlanId } from "./plans";
import { PLAN_STYLES } from "./plans";
import { cn } from "@/lib/utils";

interface FeatureRow {
  category: string;
  label: string;
  values: Record<PlanId, boolean>;
}

const FEATURE_ROWS: FeatureRow[] = [
  {
    category: "Core",
    label: "Companies",
    values: { starter: false, growth: true, scale: true },
  },
  {
    category: "Core",
    label: "Users",
    values: { starter: true, growth: true, scale: true },
  },
  {
    category: "Accounting",
    label: "Unlimited invoices",
    values: { starter: true, growth: true, scale: true },
  },
  {
    category: "Accounting",
    label: "Expense tracking",
    values: { starter: true, growth: true, scale: true },
  },
  {
    category: "Automation",
    label: "Payment reminders",
    values: { starter: false, growth: true, scale: true },
  },
  {
    category: "Automation",
    label: "Bank reconciliation",
    values: { starter: false, growth: true, scale: true },
  },
  {
    category: "Collaboration",
    label: "Client portal",
    values: { starter: false, growth: true, scale: true },
  },
  {
    category: "Reporting",
    label: "Advanced reports",
    values: { starter: false, growth: false, scale: true },
  },
];

const PLAN_ORDER: PlanId[] = ["starter", "growth", "scale"];

function CellCheck({ enabled }: { enabled: boolean }) {
  return (
    <div
      className={
        "mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs " +
        (enabled
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground")
      }
    >
      {enabled ? "✓" : "–"}
    </div>
  );
}

export function PricingFeatureTable() {
  return (
    <Section>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            See features that are best fit for your business
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Compare what is included in each plan so you can choose the one that
            matches your stage today.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card text-xs md:text-sm">
          {/* Header row */}
          <div className="grid grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] px-4 py-3 font-semibold text-foreground">
            <div className="text-left">Feature</div>
            {PLAN_ORDER.map((planId) => (
              <div
                key={planId}
                className={cn(
                  "text-center",
                  PLAN_STYLES[planId].columnBg,
                  "rounded-t-lg py-2",
                )}
              >
                {planId === "starter" && "Starter"}
                {planId === "growth" && "Growth"}
                {planId === "scale" && "Scale"}
              </div>
            ))}
          </div>

          {FEATURE_ROWS.map((row) => (
            <div
              key={row.category + row.label}
              className="grid grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] border-t border-border/50 px-4 py-3"
            >
              <div className="flex flex-col gap-1 pr-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {row.category}
                </span>
                <span className="text-sm text-foreground">{row.label}</span>
              </div>
              {PLAN_ORDER.map((planId) => (
                <div
                  key={planId}
                  className={cn(
                    "flex items-center justify-center py-1",
                    PLAN_STYLES[planId].columnBg,
                  )}
                >
                  <CellCheck enabled={row.values[planId]} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
