import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image: string | null;
  price: number;
  quantity: number | null;
  created_at: string | null;
  style: string | null;
  medium: string | null;
  size: string | null;
  dimensions: string | null;
  artist: string | null;
  featured: boolean | null;
  bestseller: boolean | null;
  rating?: number | null;
};

function mapProduct(row: ProductRow): Product {
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
    createdAt: row.created_at ?? undefined,
    rating: Number(row.rating ?? 4.6),
    style: (row.style ?? "Modern") as Product["style"],
    medium: (row.medium ?? "Oil on Canvas") as Product["medium"],
    size: (row.size ?? "Medium") as Product["size"],
    dimensions: row.dimensions ?? '30" x 40"',
    artist: row.artist ?? "Geesun Studio",
    featured: Boolean(row.featured),
    bestseller: Boolean(row.bestseller),
  };
}

function isMissingProductsTable(errorMessage: string) {
  const text = errorMessage.toLowerCase();
  return (
    text.includes("public.products") ||
    text.includes("could not find the table") ||
    text.includes("schema cache")
  );
}

export async function fetchProducts() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, title, description, image, price, quantity, created_at, style, medium, size, dimensions, artist, featured, bestseller",
    )
    .order("created_at", { ascending: false });

  if (error && isMissingProductsTable(error.message)) {
    console.warn(
      "[Geesun Crafts] Supabase table public.products is missing. Run supabase/schema.sql, then refresh.",
    );
    return [];
  }
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => mapProduct(row as ProductRow));
}

export async function fetchProductBySlug(slug: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, title, description, image, price, quantity, created_at, style, medium, size, dimensions, artist, featured, bestseller",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error && isMissingProductsTable(error.message)) {
    console.warn(
      "[Geesun Crafts] Supabase table public.products is missing. Run supabase/schema.sql, then refresh.",
    );
    return null;
  }
  if (error) throw new Error(error.message);
  if (!data) return null;

  return mapProduct(data as ProductRow);
}
