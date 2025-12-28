import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productVariants, productImages, categories } from "@/lib/db/schema";
import { eq, like, desc, sql, and, or } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { createProductSchema, productQuerySchema } from "@/lib/validations/product";
import { logError } from "@/lib/logger";

export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query params
    const queryResult = productQuerySchema.safeParse({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const { search, status, page, limit } = queryResult.data;
    const offset = (page - 1) * limit;

    // Build where conditions for database-level filtering
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.slug, `%${search}%`)
        )
      );
    }

    if (status && status !== "all") {
      conditions.push(eq(products.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Query products with database-level filtering
    const allProducts = await db.query.products.findMany({
      where: whereClause,
      orderBy: [desc(products.createdAt)],
      limit,
      offset,
      with: {
        variants: true,
        images: {
          limit: 1,
          orderBy: (images, { asc }) => [asc(images.position)],
        },
        category: true,
      },
    });

    // Get total count with same filters applied
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);

    return NextResponse.json({
      products: allProducts,
      total: Number(count),
      page,
      limit,
    });
  } catch (error) {
    logError("products.GET", error, { query: request.url });
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const body = await request.json();

    // Validate request body with Zod
    const parseResult = createProductSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      name,
      slug,
      description,
      categoryId,
      basePrice,
      compareAtPrice,
      status,
      featured,
      fiberContent,
      weight,
      yardage,
      careInstructions,
      metaTitle,
      metaDescription,
      variants,
      images,
    } = parseResult.data;

    // Use transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // Create product
      const [product] = await tx
        .insert(products)
        .values({
          name,
          slug,
          description,
          categoryId,
          basePrice,
          compareAtPrice,
          status,
          featured,
          fiberContent,
          weight,
          yardage,
          careInstructions,
          metaTitle,
          metaDescription,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();

      // Create variants
      if (variants && variants.length > 0) {
        await tx.insert(productVariants).values(
          variants.map((v, index) => ({
            productId: product.id,
            name: v.name,
            sku: v.sku || null,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            stock: v.stock,
            weightGrams: v.weightGrams,
            colorHex: v.colorHex || null,
            position: index,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }))
        );
      }

      // Create images
      if (images && images.length > 0) {
        await tx.insert(productImages).values(
          images.map((img, index) => ({
            productId: product.id,
            url: img.url,
            alt: img.alt,
            variantId: img.variantId,
            position: index,
            createdAt: new Date().toISOString(),
          }))
        );
      }

      return product;
    });

    return NextResponse.json({ success: true, product: result });
  } catch (error) {
    logError("products.POST", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
