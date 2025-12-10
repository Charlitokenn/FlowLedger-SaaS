"use client";

import * as React from "react";
import type { SessionClaims } from "@/types/auth";

interface TenantContextProviderProps {
  children: React.ReactNode;
  sessionClaims: SessionClaims;
}

// Minimal context provider wrapper for session claims.
// This allows layouts to wrap children with tenant-specific session data
// without enforcing any particular consumption pattern.
const SessionClaimsContext = React.createContext<SessionClaims | null>(null);

export function TenantContextProvider({ children, sessionClaims }: TenantContextProviderProps) {
  return (
    <SessionClaimsContext.Provider value={sessionClaims}>
      {children}
    </SessionClaimsContext.Provider>
  );
}

export function useSessionClaims() {
  const ctx = React.useContext(SessionClaimsContext);
  return ctx;
}
