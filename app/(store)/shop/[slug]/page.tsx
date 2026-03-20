import { notFound } from "next/navigation";
import { ProductDetailShell } from "@/components/product/product-detail-shell";
import { fetchProductBySlug } from "@/lib/data/products";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) notFound();

  return <ProductDetailShell product={product} />;
}
