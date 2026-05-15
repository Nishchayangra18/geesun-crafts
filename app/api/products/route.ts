import { NextResponse } from "next/server";
import { fetchProducts, getBestsellerProducts, getCategoryProducts } from "@/lib/data/products";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bestsellerOnly =
      searchParams.get("bestseller") === "true" || searchParams.get("category") === "bestsellers";
    const category = searchParams.get("category")?.toLowerCase() ?? "";
    const products = bestsellerOnly
      ? await getBestsellerProducts()
      : category
        ? await getCategoryProducts(category)
        : await fetchProducts();

    return NextResponse.json({ products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
