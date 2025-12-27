import { NextResponse } from "next/server";
import { db, addresses, customers } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

// Check if Clerk is configured
const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured =
  clerkPubKey &&
  clerkPubKey.startsWith("pk_") &&
  !clerkPubKey.includes("placeholder");

async function getCustomerId(): Promise<number | null> {
  if (!isClerkConfigured) return null;

  try {
    const { userId } = await auth();
    if (!userId) return null;

    const customer = await db.query.customers.findFirst({
      where: eq(customers.clerkId, userId),
      columns: { id: true },
    });

    return customer?.id ?? null;
  } catch {
    return null;
  }
}

// GET /api/account/addresses - List all addresses for current user
export async function GET() {
  const customerId = await getCustomerId();

  if (!customerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customerAddresses = await db.query.addresses.findMany({
    where: eq(addresses.customerId, customerId),
    orderBy: (addresses, { desc }) => [desc(addresses.isDefault), desc(addresses.createdAt)],
  });

  return NextResponse.json({ addresses: customerAddresses });
}

// POST /api/account/addresses - Create a new address
export async function POST(request: Request) {
  const customerId = await getCustomerId();

  if (!customerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate required fields
    const required = ["firstName", "lastName", "line1", "city", "postalCode", "country"];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // If this is set as default, unset other defaults first
    if (body.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.customerId, customerId));
    }

    // Create the address
    const [newAddress] = await db
      .insert(addresses)
      .values({
        customerId,
        firstName: body.firstName,
        lastName: body.lastName,
        company: body.company || null,
        line1: body.line1,
        line2: body.line2 || null,
        city: body.city,
        state: body.state || null,
        postalCode: body.postalCode,
        country: body.country,
        phone: body.phone || null,
        isDefault: body.isDefault ?? false,
      })
      .returning();

    return NextResponse.json({ address: newAddress }, { status: 201 });
  } catch (error) {
    console.error("Failed to create address:", error);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}
