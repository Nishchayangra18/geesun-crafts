import { OrderConfirmedShell } from "@/components/checkout/order-confirmed-shell";

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const params = await searchParams;
  const orderId = String(params.orderId ?? "");
  return <OrderConfirmedShell orderId={orderId} />;
}
