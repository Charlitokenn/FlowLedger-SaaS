"use client";

import { Section } from "./section";

export function ClientPortalSection() {
  return (
    <Section muted>
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Client portal
          </h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Give your clients an easy-to-use online portal for viewing invoices,
            approving quotes, and tracking payments. Share only what they need to
            see, while you keep full control behind the scenes.
          </p>
          <ul className="mt-2 space-y-2 text-sm text-slate-700">
            <li>• Secure client logins with role-based permissions</li>
            <li>• Centralized history of all communications and payments</li>
            <li>• Real-time status updates on invoices and projects</li>
          </ul>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -translate-x-4 translate-y-4 rounded-3xl bg-primary/15" />
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
            <div className="h-10 bg-muted" />
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Client Portal</span>
                <span>Overview</span>
              </div>
              <div className="h-40 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl bg-muted p-3">
                  <p className="font-semibold text-slate-800">Invoices</p>
                  <p className="mt-1 text-[11px] text-slate-600">Open, paid, and overdue at a glance.</p>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <p className="font-semibold text-slate-800">Payments</p>
                  <p className="mt-1 text-[11px] text-slate-600">Track every transaction in one place.</p>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <p className="font-semibold text-slate-800">Documents</p>
                  <p className="mt-1 text-[11px] text-slate-600">Share statements, quotes, and reports.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
