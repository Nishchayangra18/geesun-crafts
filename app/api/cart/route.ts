import { NextResponse } from "next/server";
import { triggerEvent } from "@/lib/events/trigger-event";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await triggerEvent("cart_updated", {
      cart: body.cart ?? [],
      user_id: body.userId ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update cart";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
