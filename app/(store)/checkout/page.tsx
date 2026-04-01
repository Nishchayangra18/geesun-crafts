import { CheckoutShell } from "@/components/checkout/checkout-shell";
import { redirect } from "next/navigation";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<{ step?: string }>;
}) {
  const params = (await searchParams) ?? {};
  if (params.step === "payment") {
    redirect("/checkout/payment");
  }
  if (params.step === "review") {
    redirect("/checkout/review");
  }

  return <CheckoutShell />;
}
