import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productVariants, productImages } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
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

    // Validate required fields
    if (!name || !slug || basePrice === undefined) {
      return NextResponse.json(
        { error: "Name, slug, and base price are required" },
        { status: 400 }
      );
    }

    // Create product
    const [product] = await db
      .insert(products)
      .values({
        name,
        slug,
        description,
        categoryId,
        basePrice,
        compareAtPrice,
        status: status || "draft",
        featured: featured || false,
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
      await db.insert(productVariants).values(
        variants.map((v: any, index: number) => ({
          productId: product.id,
          name: v.name || "Default",
          sku: v.sku || null,
          price: v.price || basePrice,
          compareAtPrice: v.compareAtPrice,
          stock: v.stock || 0,
          weightGrams: v.weightGrams || 100,
          position: index,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      );
    }

    // Create images
    if (images && images.length > 0) {
      await db.insert(productImages).values(
        images.map((img: any, index: number) => ({
          productId: product.id,
          url: img.url,
          alt: img.alt,
          position: index,
          createdAt: new Date().toISOString(),
        }))
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create product" },
      { status: 500 }
    );
  }
}
