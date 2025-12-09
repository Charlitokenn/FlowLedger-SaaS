"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface MarketingNavbarProps {
  className?: string;
}

export function MarketingNavbar({ className }: MarketingNavbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            FL
          </span>
          <span className="text-base font-semibold tracking-tight text-foreground">
            FlowLedger
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/features" className="hover:text-foreground">
            Features
          </Link>
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/blog" className="hover:text-foreground">
            Blog
          </Link>
        </nav>

        <div className="flex items-center gap-3 text-sm font-medium">
          <Link
            href="/sign-in"
            className="text-muted-foreground hover:text-foreground"
          >
            Login
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full bg-primary px-4 py-2 text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
