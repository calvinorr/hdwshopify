import { NextRequest, NextResponse } from "next/server";
import { db, products } from "@/lib/db";
import { eq, or, like, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = `%${query.trim()}%`;

    // Search products by name, description, sku, fiber content, and weight
    const matchingProducts = await db.query.products.findMany({
      where: and(
        eq(products.status, "active"),
        or(
          like(products.name, searchTerm),
          like(products.description, searchTerm),
          like(products.sku, searchTerm),
          like(products.fiberContent, searchTerm),
          like(products.weight, searchTerm)
        )
      ),
      limit,
      with: {
        images: {
          orderBy: (images, { asc }) => [asc(images.position)],
          limit: 1,
        },
        category: true,
      },
    });

    return NextResponse.json({
      results: matchingProducts,
      query: query.trim(),
      count: matchingProducts.length,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json(
      { error: "Failed to search products" },
      { status: 500 }
    );
  }
}
