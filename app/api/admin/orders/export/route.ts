import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { desc, and, gte, lte } from "drizzle-orm";

/**
 * Export orders as CSV
 *
 * Query params:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build query conditions
    const conditions = [];

    if (startDate) {
      conditions.push(gte(orders.createdAt, startDate));
    }

    if (endDate) {
      // Add one day to include the end date fully
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      conditions.push(lte(orders.createdAt, endDatePlusOne.toISOString()));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch orders with items
    const orderList = await db.query.orders.findMany({
      where: whereClause,
      orderBy: [desc(orders.createdAt)],
      with: {
        items: true,
      },
    });

    // Generate CSV
    const csv = generateOrdersCsv(orderList);

    // Generate filename with date range
    const filename = generateFilename(startDate, endDate);

    // Return as downloadable CSV
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting orders:", error);
    return NextResponse.json(
      { error: "Failed to export orders" },
      { status: 500 }
    );
  }
}

function generateOrdersCsv(orderList: any[]): string {
  // CSV header
  const headers = [
    "Order Number",
    "Date",
    "Customer Name",
    "Email",
    "Items",
    "Subtotal",
    "Shipping",
    "Discount",
    "Total",
    "Currency",
    "Status",
    "Payment Status",
    "Shipping Method",
    "Tracking Number",
    "Shipping Address",
  ];

  const rows = orderList.map((order) => {
    // Parse shipping address
    let shippingAddress = "";
    try {
      const addr = JSON.parse(order.shippingAddress || "{}");
      shippingAddress = [
        addr.name,
        addr.line1,
        addr.line2,
        addr.city,
        addr.state,
        addr.postalCode,
        addr.country,
      ]
        .filter(Boolean)
        .join(", ");
    } catch {
      shippingAddress = order.shippingAddress || "";
    }

    // Format items as "Product (Variant) x Qty; ..."
    const items = order.items
      .map((item: any) => {
        const name = item.variantName
          ? `${item.productName} (${item.variantName})`
          : item.productName;
        return `${name} x${item.quantity}`;
      })
      .join("; ");

    // Format date
    const date = order.createdAt
      ? new Date(order.createdAt).toISOString().split("T")[0]
      : "";

    // Extract customer name from shipping address
    let customerName = "";
    try {
      const addr = JSON.parse(order.shippingAddress || "{}");
      customerName = addr.name || "";
    } catch {
      customerName = "";
    }

    return [
      order.orderNumber,
      date,
      customerName,
      order.email,
      items,
      order.subtotal?.toFixed(2) || "0.00",
      order.shippingCost?.toFixed(2) || "0.00",
      order.discountAmount?.toFixed(2) || "0.00",
      order.total?.toFixed(2) || "0.00",
      order.currency || "GBP",
      order.status,
      order.paymentStatus,
      order.shippingMethod || "",
      order.trackingNumber || "",
      shippingAddress,
    ];
  });

  // Escape CSV values
  const escapeCSV = (value: string | number | null | undefined): string => {
    const str = String(value ?? "");
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV string
  const csvRows = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ];

  return csvRows.join("\n");
}

function generateFilename(startDate: string | null, endDate: string | null): string {
  const today = new Date().toISOString().split("T")[0];

  if (startDate && endDate) {
    return `orders_${startDate}_to_${endDate}.csv`;
  } else if (startDate) {
    return `orders_from_${startDate}.csv`;
  } else if (endDate) {
    return `orders_until_${endDate}.csv`;
  } else {
    return `orders_all_${today}.csv`;
  }
}
