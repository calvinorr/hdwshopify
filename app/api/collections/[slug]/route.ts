import { NextRequest, NextResponse } from "next/server";
import { db, categories, products } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Fetch category with children
    const category = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
      with: {
        parent: true,
        children: {
          orderBy: (categories, { asc }) => [asc(categories.position)],
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    // Fetch products in this category
    const categoryProducts = await db.query.products.findMany({
      where: eq(products.categoryId, category.id),
      orderBy: [desc(products.featured), desc(products.createdAt)],
      with: {
        images: {
          orderBy: (images, { asc }) => [asc(images.position)],
          limit: 1,
        },
      },
    });

    return NextResponse.json({
      collection: category,
      products: categoryProducts,
    });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return NextResponse.json(
      { error: "Failed to fetch collection" },
      { status: 500 }
    );
  }
}
