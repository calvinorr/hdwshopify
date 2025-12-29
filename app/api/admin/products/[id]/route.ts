import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productImages, productTagAssignments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { updateProductSchema } from "@/lib/validations/product";
import { logError } from "@/lib/logger";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const { id } = await params;
    const productId = parseInt(id, 10);

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      with: {
        images: true,
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    logError("products.GET", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Props) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  let productId: number | undefined;

  try {
    const { id } = await params;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    productId = parsedId;

    const body = await request.json();
    const parseResult = updateProductSchema.safeParse(body);

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
      price,
      compareAtPrice,
      stock,
      weightGrams,
      sku,
      colorHex,
      status,
      featured,
      fiberContent,
      weight,
      yardage,
      careInstructions,
      metaTitle,
      metaDescription,
      images,
      tagIds,
    } = parseResult.data;

    const result = await db.transaction(async (tx) => {
      const [updatedProduct] = await tx
        .update(products)
        .set({
          ...(name !== undefined && { name }),
          ...(slug !== undefined && { slug }),
          ...(description !== undefined && { description }),
          ...(categoryId !== undefined && { categoryId }),
          ...(price !== undefined && { price }),
          ...(compareAtPrice !== undefined && { compareAtPrice }),
          ...(stock !== undefined && { stock }),
          ...(weightGrams !== undefined && { weightGrams }),
          ...(sku !== undefined && { sku }),
          ...(colorHex !== undefined && { colorHex }),
          ...(status !== undefined && { status }),
          ...(featured !== undefined && { featured }),
          ...(fiberContent !== undefined && { fiberContent }),
          ...(weight !== undefined && { weight }),
          ...(yardage !== undefined && { yardage }),
          ...(careInstructions !== undefined && { careInstructions }),
          ...(metaTitle !== undefined && { metaTitle }),
          ...(metaDescription !== undefined && { metaDescription }),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(products.id, parsedId))
        .returning();

      if (!updatedProduct) {
        throw new Error("Product not found");
      }

      if (images !== undefined) {
        await tx.delete(productImages).where(eq(productImages.productId, parsedId));

        if (images.length > 0) {
          await tx.insert(productImages).values(
            images.map((img, index) => ({
              productId: parsedId,
              url: img.url,
              alt: img.alt,
              position: index,
              createdAt: new Date().toISOString(),
            }))
          );
        }
      }

      if (tagIds !== undefined) {
        await tx.delete(productTagAssignments).where(eq(productTagAssignments.productId, parsedId));

        if (tagIds.length > 0) {
          await tx.insert(productTagAssignments).values(
            tagIds.map((tagId) => ({
              productId: parsedId,
              tagId,
            }))
          );
        }
      }

      return updatedProduct;
    });

    return NextResponse.json({ success: true, product: result });
  } catch (error) {
    if (error instanceof Error && error.message === "Product not found") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    logError("products.PATCH", error, { productId });
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Props) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  let productId: number | undefined;

  try {
    const { id } = await params;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    productId = parsedId;

    await db.delete(products).where(eq(products.id, parsedId));

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("products.DELETE", error, { productId });
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
