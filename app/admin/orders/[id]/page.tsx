import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { OrderDetail } from "./order-detail";

interface Props {
  params: Promise<{ id: string }>;
}

async function getOrder(id: number) {
  return db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      items: true,
      customer: true,
      discountCode: true,
    },
  });
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const orderId = parseInt(id);

  if (isNaN(orderId)) {
    notFound();
  }

  const order = await getOrder(orderId);

  if (!order) {
    notFound();
  }

  return <OrderDetail order={order} />;
}
