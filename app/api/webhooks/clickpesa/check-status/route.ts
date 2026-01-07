import { NextRequest, NextResponse } from "next/server";
import { kv } from '@vercel/kv';

export async function POST(request: NextRequest) {
    try {
        const { orderReference } = await request.json();

        if (!orderReference) {
            return NextResponse.json(
                { error: "Order reference required" },
                { status: 400 }
            );
        }

        console.log(`🔍 Checking status for order: ${orderReference}`);

        // Retrieve from Vercel KV
        const paymentKey = `payment:${orderReference}`;
        const statusData = await kv.get<any>(paymentKey);

        if (!statusData) {
            // No status yet - payment still pending
            return NextResponse.json({
                status: "PENDING",
                message: "Payment status not yet available"
            });
        }

        console.log(`✅ Status found: ${statusData.status}`);

        return NextResponse.json(statusData);

    } catch (error) {
        console.error("❌ Status check error:", error);
        return NextResponse.json(
            { error: "Failed to check status" },
            { status: 500 }
        );
    }
}