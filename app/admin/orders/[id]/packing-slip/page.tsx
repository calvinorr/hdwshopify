import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PackingSlip } from "./packing-slip";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PackingSlipPage({ params }: PageProps) {
  const { id } = await params;
  const orderId = parseInt(id);

  if (isNaN(orderId)) {
    notFound();
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      items: true,
      customer: true,
    },
  });

  if (!order) {
    notFound();
  }

  return <PackingSlip order={order} />;
}
