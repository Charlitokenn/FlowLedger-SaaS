export interface SessionOrgClaims {
  id: string;
  rol?: string;
  slg?: string;
}

export interface SessionClaims {
  firstName?: string;
  orgLogo?: string;
  orgName?: string;
  o?: SessionOrgClaims;
}

export interface AuthData {
  sessionClaims?: SessionClaims;
  orgId?: string;
  orgSlug?: string;
  orgRole?: string | null;
}
