import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

type OrderRow = {
  id: string;
  user_id: string | null;
  created_at: string | null;
  payment_method: string | null;
  payment_status: string | null;
  shipping_address: Record<string, unknown> | null;
  coupon_code: string | null;
  subtotal_amount: number | null;
  discount_amount: number | null;
  shipping_amount: number | null;
  total_amount: number | null;
};

type OrderItemRow = {
  product_id: string | null;
  quantity: number | null;
  price: number | null;
};

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId: rawOrderId } = await params;
    const orderId = String(rawOrderId ?? "").trim();
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required." }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authSupabase = getSupabaseServerClient();
    if (!authSupabase) {
      return NextResponse.json({ error: "Supabase auth client is not configured." }, { status: 500 });
    }

    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase admin client is not configured." }, { status: 500 });
    }

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, user_id, created_at, payment_method, payment_status, shipping_address, coupon_code, subtotal_amount, discount_amount, shipping_amount, total_amount",
      )
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!orderData) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from("order_items")
      .select("product_id, quantity, price")
      .eq("order_id", orderId);
    if (orderItemsError) throw orderItemsError;

    const orderItemsRows = (orderItemsData ?? []) as OrderItemRow[];
    const productIds = [...new Set(orderItemsRows.map((item) => String(item.product_id ?? "")).filter(Boolean))];
    let productsById = new Map<string, ProductRow>();

    if (productIds.length) {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, slug, title, image")
        .in("id", productIds);
      if (productsError) throw productsError;
      productsById = new Map(
        ((productsData ?? []) as ProductRow[]).map((product) => [product.id, product]),
      );
    }

    const order = orderData as OrderRow;
    const orderItems = orderItemsRows.map((item) => {
      const productId = String(item.product_id ?? "");
      const product = productsById.get(productId) ?? null;
      return {
        product_id: productId,
        quantity: Number(item.quantity ?? 0),
        price: Number(item.price ?? 0),
        product: product
          ? {
              id: product.id,
              slug: product.slug,
              title: product.title,
              image: product.image,
            }
          : null,
      };
    });

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        created_at: order.created_at,
        payment_method: String(order.payment_method ?? ""),
        payment_status: String(order.payment_status ?? ""),
        shipping_address: order.shipping_address ?? {},
        coupon_code: order.coupon_code,
        subtotal: Number(order.subtotal_amount ?? 0),
        discount: Number(order.discount_amount ?? 0),
        shipping: Number(order.shipping_amount ?? 0),
        total: Number(order.total_amount ?? 0),
        items: orderItems,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load order details.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
