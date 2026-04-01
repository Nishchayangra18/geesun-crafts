import { NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import {
  calculateDiscountAmount,
  calculateSummaryTotals,
  evaluateCoupon,
  getFreeShippingThreshold,
  normalizeCouponCode,
  type CouponRow,
} from "@/lib/cart/pricing";

type CartItemRow = {
  product_id: string;
  quantity: number;
  product:
    | {
        id: string;
        category: string | null;
        style: string | null;
        medium: string | null;
        price: number | null;
        is_active: boolean | null;
      }
    | Array<{
        id: string;
        category: string | null;
        style: string | null;
        medium: string | null;
        price: number | null;
        is_active: boolean | null;
      }>
    | null;
};

function pickProduct(product: CartItemRow["product"]) {
  if (!product) return null;
  return Array.isArray(product) ? (product[0] ?? null) : product;
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUserFromRequest(request);
    if (!authUser?.id) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase admin client is not configured." }, { status: 500 });
    }

    const { data: cartData, error: cartError } = await supabase
      .from("carts")
      .select("id, applied_coupon_code")
      .eq("user_id", authUser.id)
      .maybeSingle();
    if (cartError) throw cartError;

    const cartId = String(cartData?.id ?? "");
    if (!cartId) {
      return NextResponse.json({
        ok: true,
        subtotal: 0,
        discount: 0,
        shipping: 0,
        total: 0,
        couponCode: null,
      });
    }

    const { data: cartItemsData, error: cartItemsError } = await supabase
      .from("cart_items")
      .select("product_id, quantity, product:products(id, category, style, medium, price, is_active)")
      .eq("cart_id", cartId);
    if (cartItemsError) throw cartItemsError;

    const cartItems = (cartItemsData ?? []) as CartItemRow[];
    const subtotal = cartItems.reduce(
      (sum, item) => sum + Number(pickProduct(item.product)?.price ?? 0) * Number(item.quantity ?? 0),
      0,
    );

    const couponCode = normalizeCouponCode(String(cartData?.applied_coupon_code ?? ""));
    const freeShippingThreshold = await getFreeShippingThreshold(supabase);

    let discountAmount = 0;
    let freeShippingCoupon = false;
    let validCouponCode: string | null = null;

    if (couponCode) {
      const { data: couponData, error: couponError } = await supabase
        .from("coupons")
        .select(
          "id, code, title, description, discount_type, discount_value, minimum_order_amount, maximum_discount, free_shipping, is_active, usage_limit, used_count, start_date, end_date, applicable_categories, applicable_product_ids",
        )
        .ilike("code", couponCode)
        .maybeSingle();
      if (couponError) throw couponError;

      if (couponData) {
        const evaluation = evaluateCoupon(couponData as CouponRow, {
          subtotal,
          cartProducts: cartItems.map((item) => ({
            id: String(item.product_id),
            category: pickProduct(item.product)?.category ?? null,
            style: pickProduct(item.product)?.style ?? null,
            medium: pickProduct(item.product)?.medium ?? null,
            price: Number(pickProduct(item.product)?.price ?? 0),
            isActive: pickProduct(item.product)?.is_active !== false,
          })),
        });

        if (evaluation.eligible) {
          discountAmount = calculateDiscountAmount(couponData as CouponRow, subtotal);
          freeShippingCoupon = Boolean((couponData as CouponRow).free_shipping);
          validCouponCode = String((couponData as CouponRow).code).toUpperCase();
        }
      }
    }

    const summary = calculateSummaryTotals({
      subtotal,
      discountAmount,
      freeShippingThreshold,
      freeShippingCoupon,
    });

    return NextResponse.json({
      ok: true,
      subtotal: summary.subtotal,
      discount: summary.discountAmount,
      shipping: summary.shipping,
      total: summary.total,
      couponCode: validCouponCode,
      itemCount: cartItems.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load cart summary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
