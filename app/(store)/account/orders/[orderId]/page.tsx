import { OrderDetailsShell } from "@/components/account/order-details-shell";

export default async function OrderDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { orderId } = await params;
  const { source } = await searchParams;
  return <OrderDetailsShell orderId={String(orderId ?? "")} source={String(source ?? "")} />;
}
