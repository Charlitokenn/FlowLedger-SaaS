import { contacts, projects } from '@/database/tenant-schema';
import { getTenantDbForRequest, MISSING_TENANT_CONTEXT_ERROR } from '@/lib/tenant-context';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const tableMap = {
    contacts,
    projects,
} as const;

export async function GET(
    request: Request,
    { params }: { params: { table: keyof typeof tableMap } }
) {
    try {
        const table = tableMap[params.table];

        if (!table) {
            return new Response('Table not found', { status: 404 });
        }

        const { db } = await getTenantDbForRequest();
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                let lastData = '';

                const sendUpdate = async () => {
                    try {
                        const data = await db.select().from(table);
                        const currentData = JSON.stringify(data);

                        if (currentData !== lastData) {
                            controller.enqueue(
                                encoder.encode(`data: ${currentData}\n\n`)
                            );
                            lastData = currentData;
                        }
                    } catch (error) {
                        console.error('SSE error:', error);
                    }
                };

                await sendUpdate();

                const interval = setInterval(sendUpdate, 2000);

                request.signal.addEventListener('abort', () => {
                    clearInterval(interval);
                    controller.close();
                });
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        if (error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR) {
            return new Response('Unauthorized', { status: 401 });
        }
        console.error('Live API error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
