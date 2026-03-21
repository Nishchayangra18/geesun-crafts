import { NextResponse } from "next/server";
import { triggerEvent } from "@/lib/events/trigger-event";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAuthenticatedUserFromRequest } from "@/lib/supabase/auth";

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUserFromRequest(request);
    const userId = authUser?.id ?? "";
    const email = authUser?.email ?? "";

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Authenticated user context is required." },
        { status: 401 },
      );
    }

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      await supabase.from("users").upsert({
        id: userId,
        email,
        created_at: new Date().toISOString(),
      });
    }

    await triggerEvent("user_registered", { user_id: userId, email });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to register user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
