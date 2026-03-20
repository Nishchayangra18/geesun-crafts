import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const amount = Number(body.amount ?? 0);
    const receipt = body.receipt ?? `order_${Date.now()}`;

    if (!amount) {
      return NextResponse.json({ error: "Amount is required." }, { status: 400 });
    }

    if (!env.razorpayKeyId || !env.razorpaySecret) {
      return NextResponse.json(
        {
          mode: "mock",
          order: {
            id: `mock_order_${Date.now()}`,
            amount: amount * 100,
            currency: "INR",
            receipt,
          },
        },
        { status: 200 },
      );
    }

    const auth = Buffer.from(`${env.razorpayKeyId}:${env.razorpaySecret}`).toString("base64");
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount * 100,
        currency: "INR",
        receipt,
      }),
    });

    const order = await razorpayResponse.json();
    if (!razorpayResponse.ok) {
      return NextResponse.json({ error: order.error?.description ?? "Failed to create Razorpay order" }, { status: 400 });
    }

    return NextResponse.json({ mode: "live", order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment order creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
