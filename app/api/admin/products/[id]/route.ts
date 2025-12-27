import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productVariants, productImages, orderItems } from "@/lib/db/schema";
import { eq, inArray, and, isNotNull } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { updateProductSchema } from "@/lib/validations/product";
import { logError, logWarn } from "@/lib/logger";

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
        variants: true,
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

    // Validate request body with Zod
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
      // Update product
      const [updatedProduct] = await tx
        .update(products)
        .set({
          ...(name !== undefined && { name }),
          ...(slug !== undefined && { slug }),
          ...(description !== undefined && { description }),
          ...(categoryId !== undefined && { categoryId }),
          ...(basePrice !== undefined && { basePrice }),
          ...(compareAtPrice !== undefined && { compareAtPrice }),
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

      // Update variants with proper upsert logic to preserve IDs
      if (variants !== undefined) {
        // Get existing variants for this product
        const existingVariants = await tx.query.productVariants.findMany({
          where: eq(productVariants.productId, parsedId),
        });
        const existingIds = existingVariants.map((v) => v.id);

        // Separate variants into updates and inserts
        const variantsToUpdate = variants.filter((v) => v.id && existingIds.includes(v.id));
        const variantsToInsert = variants.filter((v) => !v.id);
        const incomingIds = variants.filter((v) => v.id).map((v) => v.id as number);
        const idsToDelete = existingIds.filter((id) => !incomingIds.includes(id));

        // Check if any variants to delete are referenced by orders
        if (idsToDelete.length > 0) {
          const referencedVariants = await tx
            .select({ variantId: orderItems.variantId })
            .from(orderItems)
            .where(
              and(
                inArray(orderItems.variantId, idsToDelete),
                isNotNull(orderItems.variantId)
              )
            );

          const referencedIds = new Set(referencedVariants.map((r) => r.variantId));
          const safeToDelete = idsToDelete.filter((id) => !referencedIds.has(id));

          // Only delete variants that are not referenced by orders
          if (safeToDelete.length > 0) {
            await tx.delete(productVariants).where(inArray(productVariants.id, safeToDelete));
          }

          // Log warning if some variants couldn't be deleted
          const couldNotDelete = idsToDelete.filter((id) => referencedIds.has(id));
          if (couldNotDelete.length > 0) {
            logWarn("products.PATCH", "Variants could not be deleted - referenced by orders", {
              productId: parsedId,
              variantIds: couldNotDelete,
            });
          }
        }

        // Update existing variants
        for (let i = 0; i < variantsToUpdate.length; i++) {
          const v = variantsToUpdate[i];
          await tx
            .update(productVariants)
            .set({
              name: v.name,
              sku: v.sku || null,
              price: v.price,
              compareAtPrice: v.compareAtPrice,
              stock: v.stock,
              weightGrams: v.weightGrams,
              position: variants.findIndex((variant) => variant.id === v.id),
              updatedAt: new Date().toISOString(),
            })
            .where(eq(productVariants.id, v.id as number));
        }

        // Insert new variants
        if (variantsToInsert.length > 0) {
          await tx.insert(productVariants).values(
            variantsToInsert.map((v, index) => ({
              productId: parsedId,
              name: v.name,
              sku: v.sku || null,
              price: v.price,
              compareAtPrice: v.compareAtPrice,
              stock: v.stock,
              weightGrams: v.weightGrams,
              position: variantsToUpdate.length + index,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }))
          );
        }
      }

      // Update images - delete existing and recreate
      if (images !== undefined) {
        await tx.delete(productImages).where(eq(productImages.productId, parsedId));

        if (images.length > 0) {
          await tx.insert(productImages).values(
            images.map((img, index) => ({
              productId: parsedId,
              url: img.url,
              alt: img.alt,
              variantId: img.variantId,
              position: index,
              createdAt: new Date().toISOString(),
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

    // Delete product (variants and images cascade)
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
