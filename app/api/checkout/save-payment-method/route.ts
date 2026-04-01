import { NextResponse } from "next/server";
import type { PaymentMethod } from "@/lib/checkout/state";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const paymentMethod = String(body?.paymentMethod ?? "").trim().toLowerCase();
    if (paymentMethod !== "card" && paymentMethod !== "upi" && paymentMethod !== "cod") {
      return NextResponse.json({ ok: false, error: "Invalid payment method." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, paymentMethod: paymentMethod as PaymentMethod });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save payment method";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

