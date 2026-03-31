import { NextResponse } from "next/server";
import {
  calculateDiscountAmount,
  calculateSummaryTotals,
  evaluateCoupon,
  getFreeShippingThreshold,
  normalizeCouponCode,
  type CartLineInput,
  type CouponCartProduct,
  type CouponRow,
} from "@/lib/cart/pricing";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type ProductRow = {
  id: string;
  price: number | null;
  category?: string | null;
  style?: string | null;
  medium?: string | null;
  is_active?: boolean | null;
};

type ApplyCouponRequest = {
  couponCode?: string;
  cartItems?: Array<{
    productId?: string;
    quantity?: number;
    price?: number;
  }>;
  subtotal?: number;
};

function normalizeCartItems(items: ApplyCouponRequest["cartItems"]) {
  if (!Array.isArray(items)) return [] as CartLineInput[];
  return items
    .map((item) => {
      const productId = String(item?.productId ?? "").trim();
      const quantity = Number(item?.quantity ?? 0);
      const price = Number(item?.price ?? 0);
      if (!productId || !Number.isFinite(quantity) || quantity <= 0) return null;
      return {
        productId,
        quantity: Math.max(1, Math.trunc(quantity)),
        price: Number.isFinite(price) ? price : 0,
      };
    })
    .filter(Boolean) as CartLineInput[];
}

async function fetchProductRows(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>, productIds: string[]) {
  const primary = await supabase
    .from("products")
    .select("id, price, category, style, medium, is_active")
    .in("id", productIds);

  if (!primary.error) {
    return (primary.data ?? []) as ProductRow[];
  }

  const fallback = await supabase
    .from("products")
    .select("id, price, style, medium")
    .in("id", productIds);
  if (fallback.error) throw fallback.error;

  return ((fallback.data ?? []) as ProductRow[]).map((row) => ({
    ...row,
    category: null,
    is_active: true,
  }));
}

function calculateServerSubtotal(cartItems: CartLineInput[], products: ProductRow[]) {
  const byId = new Map(products.map((product) => [product.id, product]));
  let subtotal = 0;

  for (const item of cartItems) {
    const product = byId.get(item.productId);
    if (!product) continue;
    const price = Number(product.price ?? 0);
    if (!Number.isFinite(price) || price < 0) continue;
    subtotal += price * item.quantity;
  }

  return subtotal;
}

function buildCouponProducts(products: ProductRow[]): CouponCartProduct[] {
  return products.map((product) => ({
    id: product.id,
    category: product.category ?? null,
    style: product.style ?? null,
    medium: product.medium ?? null,
    price: Number(product.price ?? 0),
    isActive: product.is_active !== false,
  }));
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as ApplyCouponRequest;
    const couponCode = normalizeCouponCode(String(body.couponCode ?? ""));
    const cartItems = normalizeCartItems(body.cartItems);

    if (!couponCode) {
      return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
    }
    if (!cartItems.length) {
      return NextResponse.json({ error: "Cart items are required." }, { status: 400 });
    }

    const productIds = [...new Set(cartItems.map((item) => item.productId))];
    const products = await fetchProductRows(supabase, productIds);
    if (!products.length) {
      return NextResponse.json({ error: "No valid products found in cart." }, { status: 400 });
    }

    const subtotal = calculateServerSubtotal(cartItems, products);
    const { data: couponData, error: couponError } = await supabase
      .from("coupons")
      .select(
        "id, code, title, description, discount_type, discount_value, minimum_order_amount, maximum_discount, free_shipping, is_active, usage_limit, used_count, start_date, end_date, applicable_categories, applicable_product_ids",
      )
      .ilike("code", couponCode)
      .maybeSingle();

    if (couponError) throw couponError;
    if (!couponData) {
      return NextResponse.json({ success: false, error: "Coupon not found." }, { status: 404 });
    }

    const coupon = couponData as CouponRow;
    const couponProducts = buildCouponProducts(products);
    const evaluation = evaluateCoupon(coupon, { subtotal, cartProducts: couponProducts });
    if (!evaluation.eligible) {
      return NextResponse.json(
        {
          success: false,
          error: evaluation.reason ?? "Coupon is not valid for this cart.",
          remainingAmount: evaluation.remainingAmount,
        },
        { status: 400 },
      );
    }

    const freeShippingThreshold = await getFreeShippingThreshold(supabase);
    const discountAmount = calculateDiscountAmount(coupon, subtotal);
    const summary = calculateSummaryTotals({
      subtotal,
      discountAmount,
      freeShippingThreshold,
      freeShippingCoupon: Boolean(coupon.free_shipping),
    });

    return NextResponse.json({
      success: true,
      discountAmount: summary.discountAmount,
      shipping: summary.shipping,
      subtotal: summary.subtotal,
      total: summary.total,
      coupon: {
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: Number(coupon.discount_value ?? 0),
        freeShipping: Boolean(coupon.free_shipping),
      },
      message: `Coupon ${coupon.code} applied successfully`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to apply coupon";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

