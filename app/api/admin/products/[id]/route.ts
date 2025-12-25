import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productVariants, productImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
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
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    const body = await request.json();

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
    } = body;

    // Update product
    const [updatedProduct] = await db
      .update(products)
      .set({
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
        updatedAt: new Date().toISOString(),
      })
      .where(eq(products.id, productId))
      .returning();

    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Update variants - delete existing and recreate
    if (variants) {
      // Delete existing variants
      await db.delete(productVariants).where(eq(productVariants.productId, productId));

      // Create new variants
      if (variants.length > 0) {
        await db.insert(productVariants).values(
          variants.map((v: any, index: number) => ({
            productId,
            name: v.name || "Default",
            sku: v.sku || null,
            price: v.price || basePrice,
            compareAtPrice: v.compareAtPrice,
            stock: v.stock || 0,
            weightGrams: v.weightGrams || 100,
            position: index,
            shopifyVariantId: v.shopifyVariantId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }))
        );
      }
    }

    // Update images - delete existing and recreate
    if (images) {
      // Delete existing images
      await db.delete(productImages).where(eq(productImages.productId, productId));

      // Create new images
      if (images.length > 0) {
        await db.insert(productImages).values(
          images.map((img: any, index: number) => ({
            productId,
            url: img.url,
            alt: img.alt,
            position: index,
            createdAt: new Date().toISOString(),
          }))
        );
      }
    }

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);

    // Delete product (variants and images cascade)
    await db.delete(products).where(eq(products.id, productId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
