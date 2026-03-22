import { NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ item_id: string }> },
) {
  try {
    const authUser = await getAuthenticatedUserFromRequest(request);
    if (!authUser?.id) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { item_id: rawItemId } = await params;
    const itemId = String(rawItemId ?? "").trim();
    if (!itemId) {
      return NextResponse.json({ error: "item_id is required." }, { status: 400 });
    }

    const body = await request.json();
    const nextQuantity = Number(body.quantity);
    if (!Number.isInteger(nextQuantity) || nextQuantity <= 0) {
      return NextResponse.json(
        { error: "quantity must be a positive integer." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured." },
        { status: 500 },
      );
    }

    const { data: cartItem, error: cartItemError } = await supabase
      .from("cart_items")
      .select("id, cart_id, product_id, quantity, carts!inner(user_id)")
      .eq("id", itemId)
      .eq("carts.user_id", authUser.id)
      .maybeSingle();
    if (cartItemError) throw cartItemError;
    if (!cartItem) {
      return NextResponse.json({ error: "Cart item not found." }, { status: 404 });
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, quantity")
      .eq("id", String(cartItem.product_id))
      .maybeSingle();
    if (productError) throw productError;
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const available = Math.max(0, Number(product.quantity ?? 0));
    if (nextQuantity > available) {
      return NextResponse.json(
        {
          error: "Requested quantity exceeds current stock.",
          available,
        },
        { status: 409 },
      );
    }

    const { error: updateError } = await supabase
      .from("cart_items")
      .update({ quantity: nextQuantity })
      .eq("id", itemId)
      .eq("cart_id", String(cartItem.cart_id));
    if (updateError) throw updateError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update cart item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ item_id: string }> },
) {
  try {
    const authUser = await getAuthenticatedUserFromRequest(request);
    if (!authUser?.id) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { item_id: rawItemId } = await params;
    const itemId = String(rawItemId ?? "").trim();
    if (!itemId) {
      return NextResponse.json({ error: "item_id is required." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured." },
        { status: 500 },
      );
    }

    const { data: existingItem, error: existingError } = await supabase
      .from("cart_items")
      .select("id, carts!inner(user_id)")
      .eq("id", itemId)
      .eq("carts.user_id", authUser.id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existingItem) {
      return NextResponse.json({ error: "Cart item not found." }, { status: 404 });
    }

    const { error: deleteError } = await supabase.from("cart_items").delete().eq("id", itemId);
    if (deleteError) throw deleteError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove cart item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
