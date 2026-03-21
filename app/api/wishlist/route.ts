import { NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type WishlistRow = {
  product_id: string;
  created_at: string;
};

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

export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUserFromRequest(request);
    if (!authUser?.id) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured." },
        { status: 500 },
      );
    }

    const { data: wishlistRows, error: wishlistError } = await supabase
      .from("wishlist")
      .select("product_id, created_at")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false });
    if (wishlistError) throw wishlistError;

    const rows = (wishlistRows ?? []) as WishlistRow[];
    const productIds = rows.map((row) => row.product_id);

    let productsById = new Map<string, ReturnType<typeof mapProduct>>();
    if (productIds.length) {
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select(
          "id, slug, title, description, image, price, quantity, style, medium, size, dimensions, artist, featured, bestseller",
        )
        .in("id", productIds);
      if (productsError) throw productsError;

      productsById = new Map(
        ((products ?? []) as ProductRow[]).map((product) => [product.id, mapProduct(product)]),
      );
    }

    const items = rows.map((row) => ({
      product_id: row.product_id,
      created_at: row.created_at,
      product: productsById.get(row.product_id) ?? null,
    }));

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load wishlist";
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
    if (!productId) {
      return NextResponse.json({ error: "product_id is required." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured." },
        { status: 500 },
      );
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();
    if (productError) throw productError;
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const { error: upsertError } = await supabase
      .from("wishlist")
      .upsert(
        {
          user_id: authUser.id,
          product_id: productId,
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id,product_id" },
      );
    if (upsertError) throw upsertError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add wishlist item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
