import { NextRequest, NextResponse } from "next/server";
import { db, products, categories } from "@/lib/db";
import { eq, desc, asc, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const collection = searchParams.get("collection");
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(products.status, "active")];

    // Filter by collection/category slug
    let categoryId: number | null = null;
    if (collection) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.slug, collection),
      });
      if (category) {
        categoryId = category.id;
        conditions.push(eq(products.categoryId, categoryId));
      }
    }

    // Determine sort order
    let orderBy;
    switch (sort) {
      case "price-asc":
        orderBy = asc(products.basePrice);
        break;
      case "price-desc":
        orderBy = desc(products.basePrice);
        break;
      case "featured":
        orderBy = desc(products.featured);
        break;
      case "newest":
      default:
        orderBy = desc(products.createdAt);
        break;
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(...conditions));
    const totalCount = countResult[0]?.count || 0;

    // Fetch products with relations
    const productList = await db.query.products.findMany({
      where: and(...conditions),
      orderBy: [orderBy],
      limit,
      offset,
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

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      products: productList,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
