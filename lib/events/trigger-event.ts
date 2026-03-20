import { env } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { EventPayload, EventType } from "@/lib/types";

export async function triggerEvent(eventType: EventType, payload: EventPayload) {
  const eventRecord = {
    event_type: eventType,
    payload,
    created_at: new Date().toISOString(),
  };

  try {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      await supabase.from("event_logs").insert(eventRecord);
    } else {
      console.info("[event-log]", eventRecord);
    }
  } catch (error) {
    console.error("Failed to persist event_log:", error);
  }

  if (env.enableAutomation && env.automationWebhookUrl) {
    try {
      await fetch(env.automationWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, payload }),
      });
    } catch (error) {
      console.error("Automation webhook dispatch failed:", error);
    }
  }
}
