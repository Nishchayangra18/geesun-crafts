import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type CartItemInput = {
  productId: string;
  quantity: number;
};

type ProductRow = {
  id: string;
  slug: string | null;
  title: string | null;
  price: number | null;
  quantity: number | null;
  image: string | null;
  gallery_images: string[] | null;
  size: string | null;
  style: string | null;
  medium: string | null;
  category?: string | null;
  bestseller?: boolean | null;
  is_active?: boolean | null;
};

const MAX_RESULTS = 6;

function parseCartItems(raw: string | null): CartItemInput[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        const record = item as { productId?: unknown; quantity?: unknown };
        const productId = String(record.productId ?? "").trim();
        const quantity = Number(record.quantity ?? 0);
        if (!productId || !Number.isFinite(quantity) || quantity <= 0) return null;
        return { productId, quantity: Math.max(1, Math.trunc(quantity)) };
      })
      .filter(Boolean) as CartItemInput[];
  } catch {
    return [];
  }
}

function toArraySet(values: Array<string | null | undefined>) {
  return new Set(values.map((value) => String(value ?? "").toLowerCase()).filter(Boolean));
}

function scoreCandidate(input: {
  candidate: ProductRow;
  styleSet: Set<string>;
  categorySet: Set<string>;
  mediumSet: Set<string>;
  averagePrice: number;
}) {
  const candidateStyle = String(input.candidate.style ?? "").toLowerCase();
  const candidateCategory = String(input.candidate.category ?? "").toLowerCase();
  const candidateMedium = String(input.candidate.medium ?? "").toLowerCase();
  const candidatePrice = Math.max(0, Number(input.candidate.price ?? 0));
  const averagePrice = Math.max(1, input.averagePrice);

  let score = 0;
  if (input.styleSet.has(candidateStyle)) score += 120;
  if (input.categorySet.has(candidateCategory)) score += 90;
  if (input.mediumSet.has(candidateMedium)) score += 70;

  const diffRatio = Math.min(1, Math.abs(candidatePrice - averagePrice) / averagePrice);
  score += (1 - diffRatio) * 40;

  if (Boolean(input.candidate.bestseller)) score += 20;
  if (Number(input.candidate.quantity ?? 0) > 0) score += 10;

  return score;
}

async function fetchProductRows(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>) {
  const primary = await supabase
    .from("products")
    .select("id, slug, title, price, quantity, image, gallery_images, size, style, medium, category, bestseller, is_active")
    .order("created_at", { ascending: false })
    .limit(100);

  if (!primary.error) {
    return (primary.data ?? []) as ProductRow[];
  }

  const fallback = await supabase
    .from("products")
    .select("id, slug, title, price, quantity, image, gallery_images, size, style, medium, bestseller")
    .order("created_at", { ascending: false })
    .limit(100);

  if (fallback.error) throw fallback.error;

  return ((fallback.data ?? []) as ProductRow[]).map((row) => ({
    ...row,
    category: null,
    is_active: true,
  }));
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured." },
        { status: 500 },
      );
    }

    const url = new URL(request.url);
    const cartItems = parseCartItems(url.searchParams.get("cartItems"));
    const cartIds = new Set(cartItems.map((item) => item.productId));
    if (!cartIds.size) return NextResponse.json([]);

    const productRows = await fetchProductRows(supabase);
    const inCartProducts = productRows.filter((product) => cartIds.has(product.id));
    if (!inCartProducts.length) return NextResponse.json([]);

    const styleSet = toArraySet(inCartProducts.map((product) => product.style));
    const categorySet = toArraySet(inCartProducts.map((product) => product.category));
    const mediumSet = toArraySet(inCartProducts.map((product) => product.medium));

    const totalPrice = inCartProducts.reduce((sum, product) => sum + Math.max(0, Number(product.price ?? 0)), 0);
    const averagePrice = totalPrice / Math.max(1, inCartProducts.length);

    const recommended = productRows
      .filter((product) => !cartIds.has(product.id))
      .filter((product) => product.is_active !== false)
      .map((candidate) => ({
        candidate,
        score: scoreCandidate({
          candidate,
          styleSet,
          categorySet,
          mediumSet,
          averagePrice,
        }),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map(({ candidate }) => ({
        id: candidate.id,
        slug: candidate.slug ?? candidate.id,
        title: candidate.title ?? "Untitled Painting",
        price: Number(candidate.price ?? 0),
        stock: Math.max(0, Number(candidate.quantity ?? 0)),
        size: candidate.size ?? "",
        style: candidate.style ?? "",
        medium: candidate.medium ?? "",
        images: [candidate.image, ...(candidate.gallery_images ?? [])].filter(Boolean) as string[],
      }));

    return NextResponse.json(recommended);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load recommendations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
