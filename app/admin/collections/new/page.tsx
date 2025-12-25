import { db } from "@/lib/db";
import { CollectionForm } from "../collection-form";

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

export default async function NewCollectionPage() {
  const products = await getProducts();

  return (
    <CollectionForm
      products={products}
      assignedProductIds={[]}
      mode="create"
    />
  );
}
