import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CollectionForm } from "../collection-form";

interface Props {
  params: Promise<{ id: string }>;
}

async function getCollection(id: number) {
  return db.query.categories.findFirst({
    where: eq(categories.id, id),
  });
}

async function getProducts() {
  return db.query.products.findMany({
    orderBy: (products, { asc }) => [asc(products.name)],
    with: {
      images: {
        limit: 1,
        orderBy: (images, { asc }) => [asc(images.position)],
      },
    },
  });
}

async function getAssignedProductIds(collectionId: number) {
  const assigned = await db.query.products.findMany({
    where: eq(products.categoryId, collectionId),
    columns: { id: true },
  });
  return assigned.map((p) => p.id);
}

export default async function EditCollectionPage({ params }: Props) {
  const { id } = await params;
  const collectionId = parseInt(id, 10);

  if (isNaN(collectionId)) {
    notFound();
  }

  const [collection, allProducts, assignedProductIds] = await Promise.all([
    getCollection(collectionId),
    getProducts(),
    getAssignedProductIds(collectionId),
  ]);

  if (!collection) {
    notFound();
  }

  return (
    <CollectionForm
      collection={collection}
      products={allProducts}
      assignedProductIds={assignedProductIds}
      mode="edit"
    />
  );
}
