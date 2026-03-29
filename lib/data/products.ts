import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  article_code: string | null;
  description: string | null;
  image: string | null;
  gallery_images: string[] | null;
  price: number;
  quantity: number | null;
  max_quantity: number | null;
  set_type: string | null;
  created_at: string | null;
  style: string | null;
  medium: string | null;
  frame: string | null;
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
    articleCode: row.article_code ?? "",
    description: row.description ?? "Original handmade painting by Geesun Crafts.",
    image:
      row.image ??
      "https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?auto=format&fit=crop&w=1200&q=80",
    galleryImages: Array.isArray(row.gallery_images) ? row.gallery_images.filter(Boolean) : [],
    price: Number(row.price),
    quantity: Math.max(0, Number(row.quantity ?? 0)),
    maxQuantity: Math.max(1, Number(row.max_quantity ?? row.quantity ?? 10)),
    setType: row.set_type ?? "",
    createdAt: row.created_at ?? undefined,
    rating: Number(row.rating ?? 4.6),
    style: row.style ?? "",
    medium: row.medium ?? "",
    frame: row.frame ?? "",
    size: row.size ?? "",
    dimensions: row.dimensions ?? '30" x 40"',
    artist: row.artist ?? "Geesun Crafts",
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
      "id, slug, title, article_code, description, image, gallery_images, price, quantity, max_quantity, set_type, created_at, style, medium, frame, size, dimensions, artist, featured, bestseller",
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
      "id, slug, title, article_code, description, image, gallery_images, price, quantity, max_quantity, set_type, created_at, style, medium, frame, size, dimensions, artist, featured, bestseller",
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
