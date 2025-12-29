import { NextResponse } from "next/server";
import { db, products } from "@/lib/db";
import { eq, ne, and, or, desc } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // Get the current product
    const currentProduct = await db.query.products.findFirst({
      where: and(eq(products.slug, slug), eq(products.status, "active")),
      columns: {
        id: true,
        categoryId: true,
        weight: true,
      },
    });

    if (!currentProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Find related products with priority:
    // 1. Same category
    // 2. Same yarn weight
    // 3. Featured products
    // 4. Newest products
    const relatedProducts = await db.query.products.findMany({
      where: and(
        ne(products.id, currentProduct.id),
        eq(products.status, "active"),
        // Match either category or weight
        or(
          currentProduct.categoryId
            ? eq(products.categoryId, currentProduct.categoryId)
            : undefined,
          currentProduct.weight
            ? eq(products.weight, currentProduct.weight)
            : undefined
        )
      ),
      with: {
        images: {
          orderBy: (images, { asc }) => [asc(images.position)],
        },
        category: true,
      },
      orderBy: [desc(products.featured), desc(products.createdAt)],
      limit: 4,
    });

    // If we don't have enough related products, fill with other active products
    if (relatedProducts.length < 4) {
      const existingIds = [
        currentProduct.id,
        ...relatedProducts.map((p) => p.id),
      ];

      const fillerProducts = await db.query.products.findMany({
        where: and(
          eq(products.status, "active"),
          // Exclude current and already found products
          ...existingIds.map((id) => ne(products.id, id))
        ),
        with: {
          images: {
            orderBy: (images, { asc }) => [asc(images.position)],
          },
          category: true,
        },
        orderBy: [desc(products.featured), desc(products.createdAt)],
        limit: 4 - relatedProducts.length,
      });

      relatedProducts.push(...fillerProducts);
    }

    return NextResponse.json({ products: relatedProducts });
  } catch (error) {
    console.error("Error fetching related products:", error);
    return NextResponse.json(
      { error: "Failed to fetch related products" },
      { status: 500 }
    );
  }
}
