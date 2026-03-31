import { NextResponse } from "next/server";
import { triggerEvent } from "@/lib/events/trigger-event";
import {
  calculateDiscountAmount,
  calculateSummaryTotals,
  evaluateCoupon,
  getFreeShippingThreshold,
  normalizeCouponCode,
  type CouponRow,
} from "@/lib/cart/pricing";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAuthenticatedUserFromRequest } from "@/lib/supabase/auth";

type RequestItem = {
  product_id: string;
  quantity: number;
};

type ProductMetaRow = {
  id: string;
  category: string | null;
  style: string | null;
  medium: string | null;
  price: number | null;
  is_active: boolean | null;
};

export async function POST(request: Request) {
  let deductedItems: Array<{ product_id: string; quantity: number }> = [];

  try {
    const authUser = await getAuthenticatedUserFromRequest(request);
    if (!authUser?.id || !authUser.email) {
      return NextResponse.json(
        { error: "You must be logged in to place an order." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const items = (body.items ?? []) as RequestItem[];
    const userId = authUser.id;
    const status = "pending";
    const couponCode = normalizeCouponCode(String(body.coupon_code ?? ""));

    if (!Array.isArray(items) || !items.length) {
      return NextResponse.json({ error: "Order items are required." }, { status: 400 });
    }

    const normalizedItems = items.map((item) => ({
      product_id: String(item.product_id),
      quantity: Number(item.quantity),
    }));

    const hasInvalidItems = normalizedItems.some(
      (item) =>
        !item.product_id ||
        Number.isNaN(item.quantity) ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0,
    );
    if (hasInvalidItems) {
      return NextResponse.json(
        { error: "Each item must include valid product_id and quantity." },
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

    await supabase.from("users").upsert({
      id: userId,
      email: authUser.email,
      created_at: new Date().toISOString(),
    });

    const { data: stockData, error: stockError } = await supabase.rpc(
      "validate_and_decrement_stock",
      {
        p_items: normalizedItems,
      },
    );
    if (stockError) {
      return NextResponse.json(
        { error: stockError.message || "Insufficient stock for one or more products." },
        { status: 409 },
      );
    }

    const stockRows =
      (stockData as
        | Array<{
            product_id: string;
            quantity: number;
            unit_price: number;
            remaining_quantity: number;
          }>
        | null) ?? [];

    const stockByProductId = new Map(
      stockRows.map((row) => [String(row.product_id), Number(row.unit_price)]),
    );
    const missingStockRows = normalizedItems.filter(
      (item) => !stockByProductId.has(item.product_id),
    );
    if (missingStockRows.length) {
      await supabase.rpc("restore_stock", { p_items: normalizedItems });
      return NextResponse.json(
        { error: "Stock reservation failed for one or more products." },
        { status: 409 },
      );
    }

    deductedItems = normalizedItems;
    const serverPricedItems = normalizedItems.map((item) => ({
      ...item,
      price: stockByProductId.get(item.product_id) ?? 0,
    }));

    const subTotalAmount = serverPricedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    let discountAmount = 0;
    let shippingAmount = 0;
    let validatedCouponCode: string | null = null;

    const freeShippingThreshold = await getFreeShippingThreshold(supabase);

    if (couponCode) {
      const { data: couponData, error: couponError } = await supabase
        .from("coupons")
        .select(
          "id, code, title, description, discount_type, discount_value, minimum_order_amount, maximum_discount, free_shipping, is_active, usage_limit, used_count, start_date, end_date, applicable_categories, applicable_product_ids",
        )
        .ilike("code", couponCode)
        .maybeSingle();
      if (couponError) throw couponError;
      if (!couponData) {
        await supabase.rpc("restore_stock", { p_items: normalizedItems });
        deductedItems = [];
        return NextResponse.json({ error: "Applied coupon no longer exists." }, { status: 409 });
      }

      const { data: productMetaRows, error: productMetaError } = await supabase
        .from("products")
        .select("id, category, style, medium, price, is_active")
        .in("id", normalizedItems.map((item) => item.product_id));
      if (productMetaError) throw productMetaError;

      const couponProducts = ((productMetaRows ?? []) as ProductMetaRow[]).map((row) => ({
        id: row.id,
        category: row.category,
        style: row.style,
        medium: row.medium,
        price: Number(row.price ?? 0),
        isActive: row.is_active !== false,
      }));
      const evaluation = evaluateCoupon(couponData as CouponRow, {
        subtotal: subTotalAmount,
        cartProducts: couponProducts,
      });
      if (!evaluation.eligible) {
        await supabase.rpc("restore_stock", { p_items: normalizedItems });
        deductedItems = [];
        return NextResponse.json(
          {
            error:
              evaluation.reason ??
              "Applied coupon is no longer valid for your cart. Please review your cart and try again.",
          },
          { status: 409 },
        );
      }

      validatedCouponCode = String((couponData as CouponRow).code).toUpperCase();
      discountAmount = calculateDiscountAmount(couponData as CouponRow, subTotalAmount);
      const summaryWithCoupon = calculateSummaryTotals({
        subtotal: subTotalAmount,
        discountAmount,
        freeShippingThreshold,
        freeShippingCoupon: Boolean((couponData as CouponRow).free_shipping),
      });
      shippingAmount = summaryWithCoupon.shipping;
    } else {
      const summaryWithoutCoupon = calculateSummaryTotals({
        subtotal: subTotalAmount,
        discountAmount: 0,
        freeShippingThreshold,
        freeShippingCoupon: false,
      });
      shippingAmount = summaryWithoutCoupon.shipping;
    }

    const totalAmount = subTotalAmount - discountAmount + shippingAmount;

    let orderId = crypto.randomUUID();

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        items: serverPricedItems,
        total_amount: totalAmount,
        status,
        coupon_code: validatedCouponCode,
        discount_amount: discountAmount,
        shipping_amount: shippingAmount,
        shipping_address: body.shipping_address ?? {},
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (orderError) throw orderError;
    orderId = orderData.id as string;

    await supabase.from("order_items").insert(
      serverPricedItems.map((item) => ({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      })),
    );

    await triggerEvent("order_created", {
      order_id: orderId,
      user_id: userId,
      total_amount: totalAmount,
      item_count: serverPricedItems.length,
    });

    return NextResponse.json(
      {
        ok: true,
        orderId,
        pricing: {
          sub_total: subTotalAmount,
          discount: discountAmount,
          shipping: shippingAmount,
          total: totalAmount,
        },
        coupon: validatedCouponCode ? { code: validatedCouponCode } : null,
      },
      { status: 201 },
    );
  } catch (error) {
    try {
      if (deductedItems.length) {
        const supabase = getSupabaseAdminClient();
        if (supabase) {
          await supabase.rpc("restore_stock", { p_items: deductedItems });
        }
      }
    } catch (rollbackError) {
      console.error("Stock rollback failed:", rollbackError);
    }

    const message = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
