"use client";

import Link from "next/link";
import { Section } from "./section";

export function HeroSection() {
  return (
    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background">
      <Section className="pt-16 md:pt-24">
        <div className="flex flex-col items-center gap-10 md:flex-row md:items-start">
          <div className="max-w-xl space-y-6">
            <p className="inline-flex items-center rounded-full bg-card/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm ring-1 ring-primary/10">
              Free Accounting Software for SMEs
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Effortless accounting for modern small businesses.
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              FlowLedger is a simple, open-source accounting platform that helps you
              track income, expenses, invoices, and clients in one place.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/sign-up"
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90"
              >
                Get Started - it&apos;s free
              </Link>
              <Link
                href="/features"
                className="text-sm font-semibold text-primary hover:text-primary/80"
              >
                Explore features
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md md:max-w-lg">
            <div className="absolute -inset-4 rounded-3xl bg-card/70 shadow-lg" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
              <div className="h-10 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Dashboard</span>
                  <span className="inline-flex h-6 items-center rounded-full bg-primary/10 px-3 text-[11px] font-medium text-primary">
                    Live overview
                  </span>
                </div>
                <div className="grid grid-cols-[1.2fr_1fr] gap-4">
                  <div className="space-y-3">
                    <div className="h-24 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
                    <div className="grid grid-cols-3 gap-3 text-[11px] text-muted-foreground">
                      <div>
                        <p className="text-xs font-semibold text-foreground">Cash flow</p>
                        <p className="mt-1 rounded-lg bg-muted px-2 py-1">TZS 12.4M</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Invoices</p>
                        <p className="mt-1 rounded-lg bg-muted px-2 py-1">32 open</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Expenses</p>
                        <p className="mt-1 rounded-lg bg-muted px-2 py-1">TZS 4.2M</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 text-[11px] text-muted-foreground">
                    <div className="rounded-xl bg-muted p-3">
                      <p className="text-xs font-semibold text-foreground">Upcoming payments</p>
                      <p className="mt-1">4 invoices due this week.</p>
                    </div>
                    <div className="rounded-xl bg-muted p-3">
                      <p className="text-xs font-semibold text-foreground">Reminders</p>
                      <p className="mt-1">Automated emails keep clients on track.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
