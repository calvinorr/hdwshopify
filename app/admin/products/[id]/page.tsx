import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProductForm } from "../product-form";

interface Props {
  params: Promise<{ id: string }>;
}

async function getProduct(id: number) {
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      variants: {
        orderBy: (variants, { asc }) => [asc(variants.position)],
      },
      images: {
        orderBy: (images, { asc }) => [asc(images.position)],
      },
      category: true,
    },
  });

  return product;
}

async function getCategories() {
  return db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.name)],
  });
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    notFound();
  }

  const [product, categoryList] = await Promise.all([
    getProduct(productId),
    getCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductForm
      product={product}
      categories={categoryList}
      mode="edit"
    />
  );
}
