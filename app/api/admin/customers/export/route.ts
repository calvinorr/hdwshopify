import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers, orders, orderItems } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

/**
 * Export customers as CSV
 *
 * Query params:
 * - customerId: Export single customer (for GDPR requests)
 *
 * CSV includes: name, email, order count, total spent, marketing consent, created date
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    // Single customer export (GDPR compliance)
    if (customerId) {
      return await exportSingleCustomer(parseInt(customerId, 10));
    }

    // Bulk export all customers
    return await exportAllCustomers();
  } catch (error) {
    console.error("Error exporting customers:", error);
    return NextResponse.json(
      { error: "Failed to export customers" },
      { status: 500 }
    );
  }
}

async function exportAllCustomers() {
  // Fetch all customers with order stats
  const customerList = await db.query.customers.findMany({
    orderBy: [desc(customers.createdAt)],
    with: {
      orders: {
        columns: {
          id: true,
          total: true,
        },
      },
    },
  });

  // Generate CSV
  const csv = generateCustomersCsv(customerList);
  const today = new Date().toISOString().split("T")[0];

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers_${today}.csv"`,
    },
  });
}

async function exportSingleCustomer(customerId: number) {
  // Fetch customer with full details
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId),
    with: {
      orders: {
        with: {
          items: true,
        },
        orderBy: [desc(orders.createdAt)],
      },
      addresses: true,
    },
  });

  if (!customer) {
    return NextResponse.json(
      { error: "Customer not found" },
      { status: 404 }
    );
  }

  // Generate comprehensive GDPR export
  const gdprData = generateGdprExport(customer);
  const today = new Date().toISOString().split("T")[0];

  return new NextResponse(gdprData, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="customer_${customerId}_data_${today}.json"`,
    },
  });
}

function generateCustomersCsv(customerList: any[]): string {
  const headers = [
    "ID",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Order Count",
    "Total Spent",
    "Marketing Consent",
    "Created Date",
  ];

  const rows = customerList.map((customer) => {
    const orderCount = customer.orders?.length || 0;
    const totalSpent = customer.orders?.reduce(
      (sum: number, order: any) => sum + (order.total || 0),
      0
    ) || 0;

    const createdDate = customer.createdAt
      ? new Date(customer.createdAt).toISOString().split("T")[0]
      : "";

    return [
      customer.id,
      customer.firstName || "",
      customer.lastName || "",
      customer.email,
      customer.phone || "",
      orderCount,
      totalSpent.toFixed(2),
      customer.acceptsMarketing ? "Yes" : "No",
      createdDate,
    ];
  });

  // Escape CSV values
  const escapeCSV = (value: string | number | null | undefined): string => {
    const str = String(value ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ];

  return csvRows.join("\n");
}

function generateGdprExport(customer: any): string {
  // Comprehensive data export for GDPR compliance
  const exportData = {
    exportDate: new Date().toISOString(),
    exportType: "GDPR Data Subject Access Request",
    customer: {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      marketingConsent: customer.acceptsMarketing,
      accountCreated: customer.createdAt,
      lastUpdated: customer.updatedAt,
    },
    addresses: customer.addresses?.map((addr: any) => ({
      type: addr.type,
      name: `${addr.firstName} ${addr.lastName}`,
      company: addr.company,
      line1: addr.line1,
      line2: addr.line2,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      phone: addr.phone,
      isDefault: addr.isDefault,
    })) || [],
    orders: customer.orders?.map((order: any) => ({
      orderNumber: order.orderNumber,
      date: order.createdAt,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      discountAmount: order.discountAmount,
      total: order.total,
      currency: order.currency,
      shippingMethod: order.shippingMethod,
      trackingNumber: order.trackingNumber,
      items: order.items?.map((item: any) => ({
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        price: item.price,
      })) || [],
    })) || [],
    dataRetention: {
      note: "Order data is retained for accounting and legal compliance purposes.",
      retentionPeriod: "7 years from order date for financial records",
    },
  };

  return JSON.stringify(exportData, null, 2);
}
