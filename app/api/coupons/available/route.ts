import { NextResponse } from "next/server";
import { evaluateCoupon, type CartLineInput, type CouponCartProduct, type CouponRow } from "@/lib/cart/pricing";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type ProductApplicabilityRow = {
  id: string;
  category?: string | null;
  style?: string | null;
  medium?: string | null;
  price?: number | null;
  is_active?: boolean | null;
};

function parseCartItems(raw: string | null): CartLineInput[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        const record = item as { productId?: unknown; quantity?: unknown; price?: unknown };
        const productId = String(record.productId ?? "").trim();
        const quantity = Number(record.quantity ?? 0);
        const price = Number(record.price ?? 0);
        if (!productId || !Number.isFinite(quantity) || quantity <= 0) return null;
        return { productId, quantity: Math.max(1, Math.trunc(quantity)), price: Number.isFinite(price) ? price : 0 };
      })
      .filter(Boolean) as CartLineInput[];
  } catch {
    return [];
  }
}

function parseSubtotal(raw: string | null) {
  const parsed = Number(raw ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
}

async function fetchCartProducts(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>, productIds: string[]) {
  if (!productIds.length) return [] as CouponCartProduct[];

  const { data, error } = await supabase
    .from("products")
    .select("id, category, style, medium, price, is_active")
    .in("id", productIds);

  if (!error) {
    return ((data ?? []) as ProductApplicabilityRow[]).map((row) => ({
      id: row.id,
      category: row.category ?? null,
      style: row.style ?? null,
      medium: row.medium ?? null,
      price: Number(row.price ?? 0),
      isActive: row.is_active !== false,
    }));
  }

  const fallback = await supabase
    .from("products")
    .select("id, style, medium, price")
    .in("id", productIds);
  if (fallback.error) throw fallback.error;

  return ((fallback.data ?? []) as ProductApplicabilityRow[]).map((row) => ({
    id: row.id,
    category: null,
    style: row.style ?? null,
    medium: row.medium ?? null,
    price: Number(row.price ?? 0),
    isActive: true,
  }));
}

function mapCouponForResponse(coupon: CouponRow, eligible: boolean, remainingAmount: number) {
  return {
    code: coupon.code,
    title: coupon.title ?? coupon.code,
    description: coupon.description ?? "",
    discountType: coupon.discount_type,
    discountValue: Number(coupon.discount_value ?? 0),
    minimumOrderAmount: Number(coupon.minimum_order_amount ?? 0),
    maximumDiscount: coupon.maximum_discount === null ? null : Number(coupon.maximum_discount),
    eligible,
    remainingAmount,
    freeShipping: Boolean(coupon.free_shipping),
  };
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
    const subtotal = parseSubtotal(url.searchParams.get("subtotal"));
    const cartItems = parseCartItems(url.searchParams.get("cartItems"));
    const productIds = [...new Set(cartItems.map((item) => item.productId))];
    const cartProducts = await fetchCartProducts(supabase, productIds);

    const { data, error } = await supabase
      .from("coupons")
      .select(
        "id, code, title, description, discount_type, discount_value, minimum_order_amount, maximum_discount, free_shipping, is_active, usage_limit, used_count, start_date, end_date, applicable_categories, applicable_product_ids",
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const coupons = (data ?? []) as CouponRow[];
    const payload = coupons.map((coupon) => {
      const evaluation = evaluateCoupon(coupon, { subtotal, cartProducts });
      return mapCouponForResponse(coupon, evaluation.eligible, evaluation.remainingAmount);
    });

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load available coupons";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

