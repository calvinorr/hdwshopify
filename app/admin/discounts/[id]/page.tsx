import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { discountCodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DiscountForm } from "../discount-form";

interface Props {
  params: Promise<{ id: string }>;
}

async function getDiscount(id: number) {
  return db.query.discountCodes.findFirst({
    where: eq(discountCodes.id, id),
  });
}

export default async function EditDiscountPage({ params }: Props) {
  const { id } = await params;
  const discountId = parseInt(id);

  if (isNaN(discountId)) {
    notFound();
  }

  const discount = await getDiscount(discountId);

  if (!discount) {
    notFound();
  }

  return (
    <DiscountForm
      discount={{
        ...discount,
        type: discount.type as "percentage" | "fixed",
        active: discount.active ?? true,
      }}
      mode="edit"
    />
  );
}
