"use client";

import Link from "next/link";
import { Section } from "./section";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <Section className="py-10 text-xs text-muted-foreground">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                FL
              </span>
              <span className="font-semibold text-foreground">FlowLedger</span>
            </div>
            <p>Simple, modern bookkeeping for small businesses and freelancers.</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-foreground">Product</p>
            <ul className="space-y-1">
              <li>
                <Link href="#features" className="hover:text-slate-900">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-slate-900">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#blog" className="hover:text-slate-900">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-foreground">Company</p>
            <ul className="space-y-1">
              <li>About</li>
              <li>Partners</li>
              <li>Contact</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-foreground">Legal</p>
            <ul className="space-y-1">
              <li>Privacy policy</li>
              <li>Terms of service</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-border pt-4 text-[11px] text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} FlowLedger. All rights reserved.</p>
          <p>Made for SMEs who want stress-free accounting.</p>
        </div>
      </Section>
    </footer>
  );
}
