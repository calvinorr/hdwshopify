import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET() {
  try {
    const collections = await db.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.position)],
    });

    return NextResponse.json({ collections });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, slug, description, image, position, productIds } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Create collection
    const [collection] = await db
      .insert(categories)
      .values({
        name,
        slug,
        description,
        image,
        position: position || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    // Assign products to this collection
    if (productIds && productIds.length > 0) {
      await db
        .update(products)
        .set({ categoryId: collection.id, updatedAt: new Date().toISOString() })
        .where(inArray(products.id, productIds));
    }

    return NextResponse.json({ success: true, collection });
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create collection" },
      { status: 500 }
    );
  }
}
