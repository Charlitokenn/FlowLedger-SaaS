import * as React from "react";

import { MarketingNavbar } from "./marketing-navbar";
import { MarketingFooter } from "./marketing-footer";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
