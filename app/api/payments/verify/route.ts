import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { triggerEvent } from "@/lib/events/trigger-event";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = String(body.razorpay_order_id ?? "");
    const paymentId = String(body.razorpay_payment_id ?? "");
    const signature = String(body.razorpay_signature ?? "");

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
    }

    if (!env.razorpaySecret) {
      return NextResponse.json({ ok: true, mode: "mock_verification" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", env.razorpaySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    await triggerEvent("payment_success", {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
