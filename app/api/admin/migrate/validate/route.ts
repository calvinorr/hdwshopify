import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  products,
  productImages,
  categories,
  customers,
  addresses,
  orders,
  orderItems,
  redirects,
} from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { sql, isNull, eq } from "drizzle-orm";
import { logError } from "@/lib/logger";

interface ValidationCheck {
  category: string;
  check: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: unknown;
}

export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const checks: ValidationCheck[] = [];

    // ========== RECORD COUNTS ==========
    const counts = {
      categories: Number((await db.select({ count: sql<number>`count(*)` }).from(categories))[0].count),
      products: Number((await db.select({ count: sql<number>`count(*)` }).from(products))[0].count),
      images: Number((await db.select({ count: sql<number>`count(*)` }).from(productImages))[0].count),
      customers: Number((await db.select({ count: sql<number>`count(*)` }).from(customers))[0].count),
      addresses: Number((await db.select({ count: sql<number>`count(*)` }).from(addresses))[0].count),
      orders: Number((await db.select({ count: sql<number>`count(*)` }).from(orders))[0].count),
      orderItems: Number((await db.select({ count: sql<number>`count(*)` }).from(orderItems))[0].count),
      redirects: Number((await db.select({ count: sql<number>`count(*)` }).from(redirects))[0].count),
    };

    checks.push({
      category: "Counts",
      check: "Record counts",
      status: "pass",
      message: `${counts.products} products, ${counts.customers} customers, ${counts.orders} orders`,
      details: counts,
    });

    // ========== PRODUCT INTEGRITY ==========

    // Products without images
    const productsWithoutImages = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .leftJoin(productImages, eq(products.id, productImages.productId))
      .where(isNull(productImages.id));

    checks.push({
      category: "Products",
      check: "Products with images",
      status: productsWithoutImages.length === 0 ? "pass" : "warning",
      message:
        productsWithoutImages.length === 0
          ? "All products have images"
          : `${productsWithoutImages.length} products missing images`,
    });

    // Variants with valid prices
    const invalidPriceVariants = await db
      .select({ id: products.id })
      .from(products)
      .where(sql`${products.price} <= 0`);

    checks.push({
      category: "Products",
      check: "Variant pricing",
      status: invalidPriceVariants.length === 0 ? "pass" : "warning",
      message:
        invalidPriceVariants.length === 0
          ? "All products have valid prices"
          : `${invalidPriceVariants.length} products have zero/negative prices`,
    });

    // ========== CUSTOMER INTEGRITY ==========

    // Customers with emails
    const customersWithoutEmails = await db
      .select({ id: customers.id })
      .from(customers)
      .where(sql`${customers.email} IS NULL OR ${customers.email} = ''`);

    checks.push({
      category: "Customers",
      check: "Customer emails",
      status: customersWithoutEmails.length === 0 ? "pass" : "fail",
      message:
        customersWithoutEmails.length === 0
          ? "All customers have emails"
          : `${customersWithoutEmails.length} customers missing emails`,
    });

    // Orphaned addresses
    const orphanedAddresses = await db
      .select({ id: addresses.id })
      .from(addresses)
      .leftJoin(customers, eq(addresses.customerId, customers.id))
      .where(isNull(customers.id));

    checks.push({
      category: "Customers",
      check: "Address integrity",
      status: orphanedAddresses.length === 0 ? "pass" : "fail",
      message:
        orphanedAddresses.length === 0
          ? "All addresses linked to customers"
          : `${orphanedAddresses.length} orphaned addresses`,
    });

    // ========== ORDER INTEGRITY ==========

    // Orders with items
    const ordersWithoutItems = await db
      .select({ id: orders.id })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(isNull(orderItems.id));

    checks.push({
      category: "Orders",
      check: "Orders with items",
      status: ordersWithoutItems.length === 0 ? "pass" : "warning",
      message:
        ordersWithoutItems.length === 0
          ? "All orders have items"
          : `${ordersWithoutItems.length} orders have no items`,
    });

    // Orders with valid totals
    const ordersWithInvalidTotals = await db
      .select({ id: orders.id })
      .from(orders)
      .where(sql`${orders.total} <= 0`);

    checks.push({
      category: "Orders",
      check: "Order totals",
      status: ordersWithInvalidTotals.length === 0 ? "pass" : "warning",
      message:
        ordersWithInvalidTotals.length === 0
          ? "All orders have valid totals"
          : `${ordersWithInvalidTotals.length} orders have invalid totals`,
    });

    // ========== REDIRECT INTEGRITY ==========

    // Check for circular redirects
    const allRedirects = await db.select().from(redirects);
    const fromPaths = new Set(allRedirects.map((r) => r.fromPath));
    const circularRedirects = allRedirects.filter((r) => fromPaths.has(r.toPath));

    checks.push({
      category: "Redirects",
      check: "Circular redirects",
      status: circularRedirects.length === 0 ? "pass" : "warning",
      message:
        circularRedirects.length === 0
          ? "No circular redirects"
          : `${circularRedirects.length} potential circular redirects`,
    });

    // ========== IMAGE SAMPLE CHECK ==========

    const sampleImages = await db
      .select({ url: productImages.url })
      .from(productImages)
      .limit(5);

    if (sampleImages.length > 0) {
      let accessible = 0;
      for (const img of sampleImages) {
        try {
          const response = await fetch(img.url, { method: "HEAD" });
          if (response.ok) accessible++;
        } catch {
          // Image not accessible
        }
      }

      checks.push({
        category: "Images",
        check: "Image accessibility",
        status: accessible === sampleImages.length ? "pass" : accessible > 0 ? "warning" : "fail",
        message: `${accessible}/${sampleImages.length} sample images accessible`,
      });
    }

    // Calculate summary
    const passed = checks.filter((c) => c.status === "pass").length;
    const warnings = checks.filter((c) => c.status === "warning").length;
    const failed = checks.filter((c) => c.status === "fail").length;
    const total = checks.length;

    const overallStatus = failed > 0 ? "failed" : warnings > 0 ? "warning" : "passed";

    return NextResponse.json({
      success: true,
      summary: {
        total,
        passed,
        warnings,
        failed,
        status: overallStatus,
      },
      counts,
      checks,
      validatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logError("migrate.validate.GET", error);
    return NextResponse.json(
      { error: "Validation failed" },
      { status: 500 }
    );
  }
}
