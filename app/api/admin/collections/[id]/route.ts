import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { eq, inArray, and, ne } from "drizzle-orm";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const collectionId = parseInt(id, 10);

    const collection = await db.query.categories.findFirst({
      where: eq(categories.id, collectionId),
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    // Get assigned products
    const assignedProducts = await db.query.products.findMany({
      where: eq(products.categoryId, collectionId),
      columns: { id: true },
    });

    return NextResponse.json({
      collection,
      productIds: assignedProducts.map((p) => p.id),
    });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return NextResponse.json(
      { error: "Failed to fetch collection" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const collectionId = parseInt(id, 10);
    const body = await request.json();

    const { name, slug, description, image, position, productIds } = body;

    // Update collection
    const [updatedCollection] = await db
      .update(categories)
      .set({
        name,
        slug,
        description,
        image,
        position: position || 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(categories.id, collectionId))
      .returning();

    if (!updatedCollection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    // Update product assignments
    if (productIds !== undefined) {
      // First, remove this collection from all products that have it
      await db
        .update(products)
        .set({ categoryId: null, updatedAt: new Date().toISOString() })
        .where(eq(products.categoryId, collectionId));

      // Then, assign selected products to this collection
      if (productIds.length > 0) {
        await db
          .update(products)
          .set({ categoryId: collectionId, updatedAt: new Date().toISOString() })
          .where(inArray(products.id, productIds));
      }
    }

    return NextResponse.json({ success: true, collection: updatedCollection });
  } catch (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update collection" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const collectionId = parseInt(id, 10);

    // Remove collection from products first
    await db
      .update(products)
      .set({ categoryId: null, updatedAt: new Date().toISOString() })
      .where(eq(products.categoryId, collectionId));

    // Delete collection
    await db.delete(categories).where(eq(categories.id, collectionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json(
      { error: "Failed to delete collection" },
      { status: 500 }
    );
  }
}
