// app/api/payment-status/[id]/route.ts
import { NextRequest } from "next/server";
// import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const paymentId = params.id;

    if (!paymentId) {
        return new Response("Payment ID required", { status: 400 });
    }

    const encoder = new TextEncoder();
    let intervalId: NodeJS.Timeout;
    let checkCount = 0;
    const MAX_CHECKS = 60; // 60 checks * 2s = 2 minutes

    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Send initial connection message
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ status: 'connected' })}\n\n`)
                );

                // Poll database every 2 seconds
                intervalId = setInterval(async () => {
                    try {
                        checkCount++;

                        const payment = await db.payment.findUnique({
                            where: { id: paymentId },
                            select: {
                                id: true,
                                status: true,
                                failureReason: true,
                                metadata: true,
                                transactionId: true
                            }
                        });

                        if (!payment) {
                            console.warn(`Payment ${paymentId} not found`);
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({
                                    error: 'Payment not found'
                                })}\n\n`)
                            );
                            clearInterval(intervalId);
                            controller.close();
                            return;
                        }

                        // Send status update
                        const statusData = {
                            transactionId: payment.id,
                            status: payment.status,
                            message: payment.failureReason || payment.metadata?.message || ''
                        };

                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify(statusData)}\n\n`)
                        );

                        // Close connection if payment is final
                        if (payment.status === 'SUCCESS' || payment.status === 'FAILED') {
                            console.log(`Payment ${paymentId} reached final state: ${payment.status}`);
                            clearInterval(intervalId);
                            controller.close();
                            return;
                        }

                        // Timeout after MAX_CHECKS
                        if (checkCount >= MAX_CHECKS) {
                            console.warn(`Payment ${paymentId} timeout after ${MAX_CHECKS} checks`);
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({
                                    status: 'TIMEOUT',
                                    message: 'Payment confirmation timeout'
                                })}\n\n`)
                            );
                            clearInterval(intervalId);
                            controller.close();
                        }

                    } catch (error) {
                        console.error('SSE polling error:', error);
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({
                                error: 'Polling error'
                            })}\n\n`)
                        );
                    }
                }, 2000); // Poll every 2 seconds

                // Cleanup on client disconnect
                request.signal.addEventListener('abort', () => {
                    console.log(`Client disconnected from payment ${paymentId}`);
                    clearInterval(intervalId);
                    controller.close();
                });

            } catch (error) {
                console.error('SSE start error:', error);
                clearInterval(intervalId);
                controller.close();
            }
        },

        cancel() {
            console.log(`Stream cancelled for payment ${paymentId}`);
            clearInterval(intervalId);
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable nginx buffering
        },
    });
}