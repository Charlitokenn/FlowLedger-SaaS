import { contacts, plots, projects } from '@/database/tenant-schema';
import { getTenantDbForRequest, MISSING_TENANT_CONTEXT_ERROR } from '@/lib/tenant-context';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Production-friendly SSE endpoint.
 *
 * Design:
 * - The server DOES NOT stream full table payloads.
 * - Instead, it polls a lightweight "fingerprint" (count + max(updated_at)) and emits a change event when it moves.
 * - The client then calls `router.refresh()` (debounced) to re-render server components and pick up latest DB state.
 *
 * Why poll fingerprints?
 * - Keeps the SSE payload small and stable.
 * - Avoids JSON-stringifying full tables every tick.
 * - Works well for “realtime-ish” updates without introducing a message bus.
 */
const tableMap = {
  contacts,
  projects,
  plots,
} as const;

type TableKey = keyof typeof tableMap;

type Fingerprint = {
  count: number;
  maxUpdated: string | null;
};

function parsePositiveInt(value: string | null, fallback: number): number {
  const n = value ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function isUuid(value: string | null): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function getFingerprint(
  table: TableKey,
  db: Awaited<ReturnType<typeof getTenantDbForRequest>>['db'],
  opts: { projectId?: string },
): Promise<Fingerprint> {
  // Use updated_at columns where available.
  // We intentionally filter soft-deleted rows where relevant.
  if (table === 'projects') {
    const res: unknown = await db.execute(sql`
      SELECT
        COUNT(*)::int AS count,
        MAX(updated_at) AS max_updated
      FROM ${projects}
      WHERE is_deleted = false;
    `);

    const row = (typeof res === 'object' && res !== null && 'rows' in res)
      ? (res as { rows: Array<Record<string, unknown>> }).rows[0]
      : Array.isArray(res)
        ? (res[0] as Record<string, unknown> | undefined)
        : undefined;

    return {
      count: Number(row?.count ?? 0),
      maxUpdated: (row?.max_updated as string | null) ?? null,
    };
  }

  if (table === 'plots') {
    const whereProject = opts.projectId ? sql` AND project_id = ${opts.projectId}::uuid` : sql``;

    const res: unknown = await db.execute(sql`
      SELECT
        COUNT(*)::int AS count,
        MAX(updated_at) AS max_updated
      FROM ${plots}
      WHERE is_deleted = false${whereProject};
    `);

    const row = (typeof res === 'object' && res !== null && 'rows' in res)
      ? (res as { rows: Array<Record<string, unknown>> }).rows[0]
      : Array.isArray(res)
        ? (res[0] as Record<string, unknown> | undefined)
        : undefined;

    return {
      count: Number(row?.count ?? 0),
      maxUpdated: (row?.max_updated as string | null) ?? null,
    };
  }

  // contacts (kept for backwards compatibility)
  const res: unknown = await db.execute(sql`
    SELECT
      COUNT(*)::int AS count,
      MAX(updated_at) AS max_updated
    FROM ${contacts}
    WHERE is_deleted = false;
  `);

  const row = (typeof res === 'object' && res !== null && 'rows' in res)
    ? (res as { rows: Array<Record<string, unknown>> }).rows[0]
    : Array.isArray(res)
      ? (res[0] as Record<string, unknown> | undefined)
      : undefined;

  return {
    count: Number(row?.count ?? 0),
    maxUpdated: (row?.max_updated as string | null) ?? null,
  };
}

export async function GET(
  request: Request,
  { params }: { params: { table: TableKey } },
) {
  try {
    const tableKey = params.table;
    if (!(tableKey in tableMap)) {
      return new Response('Table not found', { status: 404 });
    }

    const url = new URL(request.url);

    // Poll interval tuning (ms).
    // Keep defaults conservative; client debounces route refresh anyway.
    const intervalMs = Math.min(
      10_000,
      Math.max(1_000, parsePositiveInt(url.searchParams.get('intervalMs'), 2_000)),
    );

    // Optional filter for plots.
    const projectId = isUuid(url.searchParams.get('projectId'))
      ? url.searchParams.get('projectId')!
      : undefined;

    const { db } = await getTenantDbForRequest();
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        // Initial retry hint (clients can still override their own behavior)
        controller.enqueue(encoder.encode(`retry: 2000\n\n`));

        let lastFingerprint: string | null = null;

        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        const tick = async () => {
          try {
            const fp = await getFingerprint(tableKey, db, { projectId });
            const current = `${fp.count}:${fp.maxUpdated ?? ''}`;

            if (lastFingerprint == null) {
              lastFingerprint = current;
              // Immediately notify client we’re connected.
              send('ready', { table: tableKey, fingerprint: current });
              return;
            }

            if (current !== lastFingerprint) {
              lastFingerprint = current;
              send('change', { table: tableKey, fingerprint: current });
            }
          } catch {
            // Avoid leaking internal errors into SSE.
            // Client will keep the connection and retry.
          }
        };

        // First check immediately.
        await tick();

        // Poll loop.
        const interval = setInterval(tick, intervalMs);

        // Keepalive comment to help some proxies keep the connection open.
        const keepAlive = setInterval(() => {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        }, 15_000);

        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          clearInterval(keepAlive);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        // Avoid buffering in some reverse proxies.
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR) {
      return new Response('Unauthorized', { status: 401 });
    }
    return new Response('Internal Server Error', { status: 500 });
  }
}
