import { NextResponse } from "next/server";
import { fetchProducts } from "@/lib/data/products";

export async function GET() {
  try {
    const products = await fetchProducts();
    return NextResponse.json({ products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
