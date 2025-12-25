import { NextRequest, NextResponse } from "next/server";
import { db, products, productVariants } from "@/lib/db";
import { eq, or, like, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = `%${query.trim()}%`;

    // Search products by name and description
    const matchingProducts = await db.query.products.findMany({
      where: and(
        eq(products.status, "active"),
        or(
          like(products.name, searchTerm),
          like(products.description, searchTerm)
        )
      ),
      limit,
      with: {
        variants: {
          orderBy: (variants, { asc }) => [asc(variants.position)],
        },
        images: {
          orderBy: (images, { asc }) => [asc(images.position)],
          limit: 1,
        },
        category: true,
      },
    });

    // Also search by variant names and get their parent products
    const matchingVariants = await db
      .select({ productId: productVariants.productId })
      .from(productVariants)
      .where(like(productVariants.name, searchTerm))
      .limit(limit);

    const variantProductIds = matchingVariants.map((v) => v.productId);

    // Fetch products that match via variant names (excluding already found products)
    const existingIds = matchingProducts.map((p) => p.id);
    const additionalProductIds = variantProductIds.filter(
      (id) => !existingIds.includes(id)
    );

    let additionalProducts: typeof matchingProducts = [];
    if (additionalProductIds.length > 0) {
      additionalProducts = await db.query.products.findMany({
        where: and(
          eq(products.status, "active"),
          sql`${products.id} IN (${sql.join(
            additionalProductIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        ),
        limit: limit - matchingProducts.length,
        with: {
          variants: {
            orderBy: (variants, { asc }) => [asc(variants.position)],
          },
          images: {
            orderBy: (images, { asc }) => [asc(images.position)],
            limit: 1,
          },
          category: true,
        },
      });
    }

    // Combine and deduplicate results
    const allResults = [...matchingProducts, ...additionalProducts].slice(
      0,
      limit
    );

    return NextResponse.json({
      results: allResults,
      query: query.trim(),
      count: allResults.length,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json(
      { error: "Failed to search products" },
      { status: 500 }
    );
  }
}
