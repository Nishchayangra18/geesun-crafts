import { ShopShell } from "@/components/shop/shop-shell";
import { fetchProducts } from "@/lib/data/products";

export default async function ShopPage() {
  const products = await fetchProducts();
  return <ShopShell products={products} />;
}
