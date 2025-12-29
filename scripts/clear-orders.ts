import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../lib/db";
import { orders, orderItems } from "../lib/db/schema";

async function clearOrders() {
  console.log("🗑️  Clearing orders data...\n");

  // Check existing counts
  const existingOrders = await db.query.orders.findMany();
  const existingItems = await db.query.orderItems.findMany();

  console.log(`Found ${existingOrders.length} orders and ${existingItems.length} order items.`);

  if (existingOrders.length === 0) {
    console.log("No orders to delete.");
    return;
  }

  // Delete order items first (foreign key constraint)
  console.log("Deleting order items...");
  await db.delete(orderItems);

  // Delete orders
  console.log("Deleting orders...");
  await db.delete(orders);

  console.log("\n✅ All orders and order items cleared.");
}

clearOrders()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error clearing orders:", err);
    process.exit(1);
  });
