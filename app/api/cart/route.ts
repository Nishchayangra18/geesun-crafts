import { NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image: string | null;
  price: number;
  quantity: number | null;
  style: string | null;
  medium: string | null;
  size: string | null;
  dimensions: string | null;
  artist: string | null;
  featured: boolean | null;
  bestseller: boolean | null;
};

type CartItemRow = {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
};

function mapProduct(row: ProductRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "Original handmade painting by Geesun Crafts.",
    image:
      row.image ??
      "https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?auto=format&fit=crop&w=1200&q=80",
    price: Number(row.price),
    quantity: Math.max(0, Number(row.quantity ?? 0)),
    rating: 4.6,
    style: (row.style ?? "Modern") as "Abstract" | "Traditional" | "Modern" | "Custom",
    medium: (row.medium ?? "Oil on Canvas") as
      | "Oil on Canvas"
      | "Acrylic"
      | "Mixed Media"
      | "Watercolor",
    size: (row.size ?? "Medium") as "Small" | "Medium" | "Large",
    dimensions: row.dimensions ?? '30" x 40"',
    artist: row.artist ?? "Geesun Studio",
    featured: Boolean(row.featured),
    bestseller: Boolean(row.bestseller),
  };
}

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

async function buildCartPayload(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>, cartId: string) {
  const { data: cartRows, error: cartRowsError } = await supabase
    .from("cart_items")
    .select("id, cart_id, product_id, quantity, created_at")
    .eq("cart_id", cartId)
    .order("created_at", { ascending: false });
  if (cartRowsError) throw cartRowsError;

  const items = (cartRows ?? []) as CartItemRow[];
  if (!items.length) return [] as Array<{ id: string; quantity: number; product_id: string; created_at: string; product: ReturnType<typeof mapProduct> | null }>;

  const productIds = items.map((item) => item.product_id);
  const { data: productRows, error: productRowsError } = await supabase
    .from("products")
    .select(
      "id, slug, title, description, image, price, quantity, style, medium, size, dimensions, artist, featured, bestseller",
    )
    .in("id", productIds);
  if (productRowsError) throw productRowsError;

  const productsById = new Map(
    ((productRows ?? []) as ProductRow[]).map((product) => [product.id, mapProduct(product)]),
  );

  return items.map((item) => ({
    id: item.id,
    product_id: item.product_id,
    quantity: Number(item.quantity),
    created_at: item.created_at,
    product: productsById.get(item.product_id) ?? null,
  }));
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUserFromRequest(request);
    if (!authUser?.id) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { supabase, cartId } = await ensureCartIdForUser(authUser.id);
    if (!supabase || !cartId) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured." },
        { status: 500 },
      );
    }

    const items = await buildCartPayload(supabase, cartId);
    return NextResponse.json({ ok: true, cart_id: cartId, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load cart";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUserFromRequest(request);
    if (!authUser?.id) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();
    const productId = String(body.product_id ?? "").trim();
    const requestedQuantity = Number(body.quantity ?? 1);
    const quantityToAdd = Number.isFinite(requestedQuantity)
      ? Math.max(1, Math.trunc(requestedQuantity))
      : 1;

    if (!productId) {
      return NextResponse.json({ error: "product_id is required." }, { status: 400 });
    }

    const { supabase, cartId } = await ensureCartIdForUser(authUser.id);
    if (!supabase || !cartId) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured." },
        { status: 500 },
      );
    }

    const { data: productRow, error: productError } = await supabase
      .from("products")
      .select("id, quantity")
      .eq("id", productId)
      .maybeSingle();
    if (productError) throw productError;
    if (!productRow) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const available = Math.max(0, Number(productRow.quantity ?? 0));
    if (available <= 0) {
      return NextResponse.json(
        { error: "This product is currently out of stock.", available: 0 },
        { status: 409 },
      );
    }

    const { data: existingItem, error: existingError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cartId)
      .eq("product_id", productId)
      .maybeSingle();
    if (existingError) throw existingError;

    const currentQuantity = existingItem ? Number(existingItem.quantity) : 0;
    const nextQuantity = currentQuantity + quantityToAdd;

    if (nextQuantity > available) {
      return NextResponse.json(
        {
          error: "Requested quantity exceeds current stock.",
          available,
          current_quantity: currentQuantity,
        },
        { status: 409 },
      );
    }

    if (existingItem?.id) {
      const { error: updateError } = await supabase
        .from("cart_items")
        .update({ quantity: nextQuantity })
        .eq("id", existingItem.id)
        .eq("cart_id", cartId);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase.from("cart_items").insert({
        cart_id: cartId,
        product_id: productId,
        quantity: nextQuantity,
        created_at: new Date().toISOString(),
      });
      if (insertError) throw insertError;
    }

    const items = await buildCartPayload(supabase, cartId);
    return NextResponse.json({ ok: true, cart_id: cartId, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add cart item";
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
      return NextResponse.json(
        { error: "Supabase admin client is not configured." },
        { status: 500 },
      );
    }

    const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId);
    if (error) throw error;

    return NextResponse.json({ ok: true, cart_id: cartId, items: [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to clear cart";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
