import { auth, clerkClient } from '@clerk/nextjs/server';
import { getTenantDb } from '@/lib/tenant-db';
import { posts, users, comments } from '@/db/tenant-schema';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const tableMap = {
    posts,
    users,
    comments,
} as const;

export async function GET(
    request: Request,
    { params }: { params: { table: keyof typeof tableMap } }
) {
    try {
        const authData = await auth();

        if (!authData.userId || !authData.orgId || !authData.orgSlug) {
            return new Response('Unauthorized', { status: 401 });
        }

        const table = tableMap[params.table];

        if (!table) {
            return new Response('Table not found', { status: 404 });
        }

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                let lastData = '';

                const sendUpdate = async () => {
                    try {
                        const client = await clerkClient();
                        const org = await client.organizations.getOrganization({
                            organizationId: authData.orgId!,
                        });

                        const db = await getTenantDb(
                            authData.orgId!,
                            authData.orgSlug!,
                            org.name
                        );

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
        console.error('Live API error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}