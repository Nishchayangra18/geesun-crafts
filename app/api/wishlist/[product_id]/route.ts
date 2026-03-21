import { NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ product_id: string }> },
) {
  try {
    const authUser = await getAuthenticatedUserFromRequest(request);
    if (!authUser?.id) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { product_id: rawProductId } = await params;
    const productId = String(rawProductId ?? "").trim();
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

    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("user_id", authUser.id)
      .eq("product_id", productId);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove wishlist item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
