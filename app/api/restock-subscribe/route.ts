import { NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type SubscriptionRow = {
  id: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function applyUserSpecificSubscriptionFilter<T>({
  query,
  userId,
  email,
}: {
  query: T & { or: (filters: string) => T };
  userId?: string | null;
  email?: string | null;
}) {
  const filters: string[] = [];
  if (userId) filters.push(`user_id.eq.${userId}`);
  if (email) filters.push(`email.eq.${email}`);
  if (!filters.length) return query;
  return query.or(filters.join(","));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const productId = String(url.searchParams.get("product_id") ?? "").trim();
    const email = normalizeEmail(url.searchParams.get("email"));

    if (!productId) {
      return NextResponse.json({ error: "product_id is required." }, { status: 400 });
    }

    if (email && !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured." },
        { status: 500 },
      );
    }

    const authUser = await getAuthenticatedUserFromRequest(request);
    if (!authUser?.id && !email) {
      return NextResponse.json({ subscribed: false });
    }

    let query = supabase
      .from("restock_subscriptions")
      .select("id")
      .eq("product_id", productId);

    query = applyUserSpecificSubscriptionFilter({
      query,
      userId: authUser?.id ?? null,
      email: email || null,
    });

    const { data, error } = await query.limit(1);
    if (error) throw error;

    const rows = (data ?? []) as SubscriptionRow[];
    return NextResponse.json({ subscribed: rows.length > 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load restock subscription status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = normalizeEmail(body?.email);
    const productId = String(body?.product_id ?? "").trim();

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ error: "product_id is required." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured." },
        { status: 500 },
      );
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();
    if (productError) throw productError;
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const authUser = await getAuthenticatedUserFromRequest(request);
    let existingQuery = supabase
      .from("restock_subscriptions")
      .select("id")
      .eq("product_id", productId);
    existingQuery = applyUserSpecificSubscriptionFilter({
      query: existingQuery,
      userId: authUser?.id ?? null,
      email,
    });

    const { data: existingRows, error: existingError } = await existingQuery.limit(1);
    if (existingError) throw existingError;

    if (((existingRows ?? []) as SubscriptionRow[]).length > 0) {
      return NextResponse.json({ ok: true, subscribed: true, duplicate: true });
    }

    const { error: insertError } = await supabase.from("restock_subscriptions").insert({
      user_id: authUser?.id ?? null,
      email,
      product_id: productId,
      notified: false,
    });

    if (insertError) {
      // Duplicate protection in case of race condition.
      if (String((insertError as { code?: string }).code ?? "") === "23505") {
        return NextResponse.json({ ok: true, subscribed: true, duplicate: true });
      }
      throw insertError;
    }

    return NextResponse.json({ ok: true, subscribed: true, duplicate: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create restock subscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
