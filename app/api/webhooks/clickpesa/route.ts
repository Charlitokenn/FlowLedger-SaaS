import { NextRequest, NextResponse } from "next/server";
import { kv } from '@vercel/kv';
import crypto from "crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const rawBody = await request.text();

        if (!rawBody) {
            console.warn("⚠️ Empty webhook body");
            return NextResponse.json({ error: "Empty webhook body" }, { status: 400 });
        }

        const receivedChecksum = request.headers.get("x-clickpesa-checksum");

        if (!receivedChecksum) {
            console.error("🚨 Missing checksum header");
            return NextResponse.json({ error: "Missing checksum" }, { status: 401 });
        }

        const isValid = verifyWebhookChecksumRaw(rawBody, receivedChecksum);

        if (!isValid) {
            console.error("🚨 Invalid checksum");
            return NextResponse.json({ error: "Invalid checksum" }, { status: 401 });
        }

        const body = JSON.parse(rawBody);
        const { event, data } = body;

        if (!event || !data?.id) {
            console.error("⚠️ Invalid payload structure:", body);
            return NextResponse.json({ error: "Invalid payload structure" }, { status: 400 });
        }

        console.log("✅ ClickPesa webhook verified:", {
            event,
            id: data.id,
            orderReference: data.orderReference,
            status: data.status
        });

        // 🎯 STORE THE PAYMENT STATUS IN VERCEL KV
        const paymentKey = `payment:${data.orderReference}`;
        const paymentData = {
            status: data.status,
            message: data.message,
            transactionId: data.id,
            channel: data.channel,
            customer: data.customer,
            updatedAt: data.updatedAt || new Date().toISOString(),
            event: event
        };

        // Store with 1 hour expiry
        await kv.set(paymentKey, paymentData, { ex: 3600 });

        console.log(`💾 Payment status stored in KV for ${data.orderReference}:`, data.status);

        // Optional: Store transaction history
        const historyKey = `payment:history:${data.orderReference}`;
        const history = await kv.get<any[]>(historyKey) || [];
        history.push({
            ...paymentData,
            timestamp: new Date().toISOString()
        });
        await kv.set(historyKey, history, { ex: 3600 });

        return NextResponse.json({
            success: true,
            processingTime: Date.now() - startTime
        });

    } catch (err) {
        console.error("❌ Webhook error:", err);
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }
}

function verifyWebhookChecksumRaw(rawBody: string, receivedChecksum: string): boolean {
    try {
        const secret = process.env.CLICKPESA_CHECKSUM_KEY;

        if (!secret) {
            console.error("🚨 CLICKPESA_CHECKSUM_KEY not configured!");
            return false;
        }

        const calculated = crypto
            .createHmac("sha256", secret)
            .update(rawBody)
            .digest("hex");

        if (receivedChecksum.length !== calculated.length) {
            return false;
        }

        return crypto.timingSafeEqual(
            Buffer.from(receivedChecksum, "hex"),
            Buffer.from(calculated, "hex")
        );
    } catch (err) {
        console.error("Checksum verification error:", err);
        return false;
    }
}