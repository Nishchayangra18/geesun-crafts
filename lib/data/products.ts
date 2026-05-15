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
  category: string | null;
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

const PRODUCT_SELECT =
  "id, slug, title, article_code, description, image, gallery_images, price, quantity, max_quantity, set_type, category, created_at, style, medium, frame, size, dimensions, artist, featured, bestseller";

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
    category: row.category ?? "",
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
    .select(PRODUCT_SELECT)
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

async function getProductSalesTotals(productIds: string[]) {
  if (!productIds.length) return new Map<string, number>();

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const { data, error } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .in("product_id", productIds);

  if (error) {
    console.warn("[Geesun Crafts] Could not load bestseller sales totals. Falling back to product priority.", error.message);
    return new Map<string, number>();
  }

  return (data ?? []).reduce((totals, item) => {
    const productId = typeof item.product_id === "string" ? item.product_id : "";
    if (!productId) return totals;

    totals.set(productId, (totals.get(productId) ?? 0) + Number(item.quantity ?? 0));
    return totals;
  }, new Map<string, number>());
}

export async function getBestsellerProducts() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("bestseller", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error && isMissingProductsTable(error.message)) {
    console.warn(
      "[Geesun Crafts] Supabase table public.products is missing. Run supabase/schema.sql, then refresh.",
    );
    return [];
  }
  if (error) throw new Error(error.message);

  const products = (data ?? []).map((row) => mapProduct(row as ProductRow));
  const salesTotals = await getProductSalesTotals(products.map((product) => product.id));

  return [...products].sort((a, b) => {
    const salesDifference = (salesTotals.get(b.id) ?? 0) - (salesTotals.get(a.id) ?? 0);
    if (salesDifference !== 0) return salesDifference;

    const featuredDifference = Number(b.featured) - Number(a.featured);
    if (featuredDifference !== 0) return featuredDifference;

    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
    return bTime - aTime;
  });
}

export async function getCategoryProducts(category: string) {
  const normalizedCategory = category.trim().toLowerCase();
  if (!["abstract", "spiritual", "landscape"].includes(normalizedCategory)) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .or(`category.ilike.${normalizedCategory},style.ilike.${normalizedCategory}`)
    .order("featured", { ascending: false })
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
    .select(PRODUCT_SELECT)
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
