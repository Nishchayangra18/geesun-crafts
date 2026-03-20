import { NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type RequestItem = {
  product_id: string;
  quantity: number;
};

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUserFromRequest(request);
    if (!authUser?.id) {
      return NextResponse.json(
        { error: "You must be logged in to validate stock." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const items = (body.items ?? []) as RequestItem[];
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

    const requestedMap = new Map<string, number>();
    for (const item of normalizedItems) {
      requestedMap.set(
        item.product_id,
        (requestedMap.get(item.product_id) ?? 0) + item.quantity,
      );
    }
    const productIds = [...requestedMap.keys()];

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured." },
        { status: 500 },
      );
    }

    const { data: products, error } = await supabase
      .from("products")
      .select("id, title, quantity")
      .in("id", productIds);
    if (error) throw error;

    const productMap = new Map(
      (products ?? []).map((product) => [
        String(product.id),
        {
          title: String(product.title),
          quantity: Number(product.quantity ?? 0),
        },
      ]),
    );

    const issues = productIds
      .map((productId) => {
        const requested = requestedMap.get(productId) ?? 0;
        const product = productMap.get(productId);
        if (!product) {
          return {
            product_id: productId,
            reason: "not_found",
            requested,
            available: 0,
          };
        }
        if (requested > product.quantity) {
          return {
            product_id: productId,
            title: product.title,
            reason: "insufficient_stock",
            requested,
            available: product.quantity,
          };
        }
        return null;
      })
      .filter(Boolean);

    if (issues.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "Some items are out of stock or unavailable.",
          issues,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stock validation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
