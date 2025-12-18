import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql, eq } from 'drizzle-orm';

import { catalogDb } from '@/database/drizzle-catalog';
import { tenants } from '@/database/catalog-schema';
import { decrypt } from '@/lib/encryption';

export const runtime = 'nodejs';

type ExecRow = Record<string, unknown>;

function extractRows(res: unknown): ExecRow[] {
  if (Array.isArray(res)) {
    return res.filter((r): r is ExecRow => typeof r === 'object' && r !== null);
  }
  if (typeof res === 'object' && res !== null && 'rows' in res) {
    const rows = (res as { rows?: unknown }).rows;
    if (Array.isArray(rows)) {
      return rows.filter((r): r is ExecRow => typeof r === 'object' && r !== null);
    }
  }
  return [];
}

export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret');

  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const allTenants = await catalogDb.select().from(tenants).where(eq(tenants.isActive, true));

  const results: Array<{ tenantId: string; orgSlug: string; updated?: number; error?: string }> = [];

  for (const t of allTenants) {
    try {
      const connectionString = decrypt(t.connectionString);
      const db = drizzle(neon(connectionString));

      const res: unknown = await db.execute(sql`SELECT public.evaluate_contract_delinquency(current_date) AS updated;`);
      const rows = extractRows(res);
      const updatedRaw = rows[0]?.updated ?? 0;
      const updated = typeof updatedRaw === 'number' ? updatedRaw : Number(updatedRaw);

      results.push({ tenantId: String(t.clerkOrgId), orgSlug: t.clerkOrgSlug, updated });
    } catch (e) {
      results.push({
        tenantId: String(t.clerkOrgId),
        orgSlug: t.clerkOrgSlug,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({ ok: true, tenants: results.length, results });
}
