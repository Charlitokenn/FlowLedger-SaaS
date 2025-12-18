import { auth } from '@clerk/nextjs/server';
import type { SessionClaims } from '@/types/auth';

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export async function requireStaffRole(allowedRoles: string[] = ['admin', 'super_admin']) {
  const { sessionClaims } = await auth();
  const claims = sessionClaims as SessionClaims | null;

  if (!claims) {
    throw new AuthorizationError('Unauthorized');
  }

  const role = claims?.o?.rol;

  if (!role || !allowedRoles.includes(role)) {
    throw new AuthorizationError('Forbidden');
  }

  return { role };
}
