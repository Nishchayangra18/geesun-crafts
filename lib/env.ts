import { parseBoolean } from "@/lib/utils";

export const env = {
  enableAutomation: parseBoolean(process.env.ENABLE_AUTOMATION, false),
  automationWebhookUrl: process.env.AUTOMATION_WEBHOOK_URL ?? "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  razorpayKeyId: process.env.RAZORPAY_KEY ?? "",
  razorpaySecret: process.env.RAZORPAY_SECRET ?? "",
};
