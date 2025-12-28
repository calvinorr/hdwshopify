import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { updateCollectionSchema } from "@/lib/validations/collection";
import { logError } from "@/lib/logger";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

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
    logError("collections.GET", error);
    return NextResponse.json(
      { error: "Failed to fetch collection" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Props) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  let collectionId: number | undefined;

  try {
    const { id } = await params;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "Invalid collection ID" }, { status: 400 });
    }

    collectionId = parsedId;

    const body = await request.json();

    // Validate request body with Zod
    const parseResult = updateCollectionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      name, slug, description, image, position, productIds,
      status, metaTitle, metaDescription, featured, hideOutOfStock
    } = parseResult.data;

    // Use transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // Update collection
      const [updatedCollection] = await tx
        .update(categories)
        .set({
          ...(name !== undefined && { name }),
          ...(slug !== undefined && { slug }),
          ...(description !== undefined && { description }),
          ...(image !== undefined && { image }),
          ...(position !== undefined && { position }),
          ...(status !== undefined && { status }),
          ...(metaTitle !== undefined && { metaTitle }),
          ...(metaDescription !== undefined && { metaDescription }),
          ...(featured !== undefined && { featured }),
          ...(hideOutOfStock !== undefined && { hideOutOfStock }),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(categories.id, parsedId))
        .returning();

      if (!updatedCollection) {
        throw new Error("Collection not found");
      }

      // Update product assignments
      if (productIds !== undefined) {
        // First, remove this collection from all products that have it
        await tx
          .update(products)
          .set({ categoryId: null, updatedAt: new Date().toISOString() })
          .where(eq(products.categoryId, parsedId));

        // Then, assign selected products to this collection
        if (productIds.length > 0) {
          await tx
            .update(products)
            .set({ categoryId: parsedId, updatedAt: new Date().toISOString() })
            .where(inArray(products.id, productIds));
        }
      }

      return updatedCollection;
    });

    return NextResponse.json({ success: true, collection: result });
  } catch (error) {
    if (error instanceof Error && error.message === "Collection not found") {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    logError("collections.PATCH", error, { collectionId });
    return NextResponse.json(
      { error: "Failed to update collection" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Props) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  let collectionId: number | undefined;

  try {
    const { id } = await params;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "Invalid collection ID" }, { status: 400 });
    }

    collectionId = parsedId;

    // Use transaction to ensure data consistency
    await db.transaction(async (tx) => {
      // Remove collection from products first
      await tx
        .update(products)
        .set({ categoryId: null, updatedAt: new Date().toISOString() })
        .where(eq(products.categoryId, parsedId));

      // Delete collection
      await tx.delete(categories).where(eq(categories.id, parsedId));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("collections.DELETE", error, { collectionId });
    return NextResponse.json(
      { error: "Failed to delete collection" },
      { status: 500 }
    );
  }
}
