import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { createCollectionSchema } from "@/lib/validations/collection";
import { logError } from "@/lib/logger";

export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const collections = await db.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.position)],
    });

    return NextResponse.json({ collections });
  } catch (error) {
    logError("collections.GET", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
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
    const parseResult = createCollectionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { name, slug, description, image, position, productIds } = parseResult.data;

    // Use transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // Create collection
      const [collection] = await tx
        .insert(categories)
        .values({
          name,
          slug,
          description,
          image,
          position,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();

      // Assign products to this collection
      if (productIds && productIds.length > 0) {
        await tx
          .update(products)
          .set({ categoryId: collection.id, updatedAt: new Date().toISOString() })
          .where(inArray(products.id, productIds));
      }

      return collection;
    });

    return NextResponse.json({ success: true, collection: result });
  } catch (error) {
    logError("collections.POST", error);
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 }
    );
  }
}
