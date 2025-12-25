import { db } from "@/lib/db";
import { ProductForm } from "../product-form";

async function getCategories() {
  return db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.name)],
  });
}

export default async function NewProductPage() {
  const categories = await getCategories();

  return <ProductForm categories={categories} mode="create" />;
}
