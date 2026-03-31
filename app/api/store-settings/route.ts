import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { DEFAULT_FREE_SHIPPING_THRESHOLD, getFreeShippingThreshold } from "@/lib/cart/pricing";

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { freeShippingThreshold: DEFAULT_FREE_SHIPPING_THRESHOLD },
        { status: 200 },
      );
    }

    const freeShippingThreshold = await getFreeShippingThreshold(supabase);
    return NextResponse.json({ freeShippingThreshold });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load store settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

