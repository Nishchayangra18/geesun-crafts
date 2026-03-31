import { NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/supabase/auth";
import { normalizeCouponCode } from "@/lib/cart/pricing";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

async function ensureCartIdForUser(userId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { supabase: null, cartId: null as string | null };

  const { data: existingCart, error: existingCartError } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existingCartError) throw existingCartError;
  if (existingCart?.id) {
    return { supabase, cartId: String(existingCart.id) };
  }

  const { data: createdCart, error: createdCartError } = await supabase
    .from("carts")
    .insert({
      user_id: userId,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (createdCartError) throw createdCartError;

  return { supabase, cartId: String(createdCart.id) };
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUserFromRequest(request);
    if (!authUser?.id) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const couponCode = normalizeCouponCode(String(body?.couponCode ?? ""));
    if (!couponCode) {
      return NextResponse.json({ error: "couponCode is required." }, { status: 400 });
    }

    const { supabase, cartId } = await ensureCartIdForUser(authUser.id);
    if (!supabase || !cartId) {
      return NextResponse.json({ error: "Supabase admin client is not configured." }, { status: 500 });
    }

    const { error } = await supabase
      .from("carts")
      .update({
        applied_coupon_code: couponCode,
      })
      .eq("id", cartId)
      .eq("user_id", authUser.id);
    if (error) throw error;

    return NextResponse.json({ ok: true, couponCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save coupon";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthenticatedUserFromRequest(request);
    if (!authUser?.id) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { supabase, cartId } = await ensureCartIdForUser(authUser.id);
    if (!supabase || !cartId) {
      return NextResponse.json({ error: "Supabase admin client is not configured." }, { status: 500 });
    }

    const { error } = await supabase
      .from("carts")
      .update({
        applied_coupon_code: null,
      })
      .eq("id", cartId)
      .eq("user_id", authUser.id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to clear coupon";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

