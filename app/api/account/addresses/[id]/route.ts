import { NextResponse } from "next/server";
import { db, addresses, customers } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";

// Check if Clerk is configured
const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured =
  clerkPubKey &&
  clerkPubKey.startsWith("pk_") &&
  !clerkPubKey.includes("placeholder");

async function getOrCreateCustomerId(): Promise<number | null> {
  if (!isClerkConfigured) return null;

  try {
    const { userId } = await auth();
    if (!userId) return null;

    // Try to find existing customer
    const existing = await db.query.customers.findFirst({
      where: eq(customers.clerkId, userId),
      columns: { id: true },
    });

    if (existing) return existing.id;

    // No customer exists - create one using Clerk user data
    const user = await currentUser();
    if (!user) return null;

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) return null;

    // Create new customer record
    const [newCustomer] = await db
      .insert(customers)
      .values({
        email,
        clerkId: userId,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
      })
      .returning({ id: customers.id });

    return newCustomer?.id ?? null;
  } catch (error) {
    console.error("Failed to get/create customer:", error);
    return null;
  }
}

// PATCH /api/account/addresses/[id] - Update an address
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const customerId = await getOrCreateCustomerId();

  if (!customerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const addressId = parseInt(id, 10);

  if (isNaN(addressId)) {
    return NextResponse.json({ error: "Invalid address ID" }, { status: 400 });
  }

  try {
    // Verify the address belongs to this customer
    const existingAddress = await db.query.addresses.findFirst({
      where: and(
        eq(addresses.id, addressId),
        eq(addresses.customerId, customerId)
      ),
    });

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const body = await request.json();

    // If setting as default, unset other defaults first
    if (body.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.customerId, customerId));
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "firstName",
      "lastName",
      "company",
      "line1",
      "line2",
      "city",
      "state",
      "postalCode",
      "country",
      "phone",
      "isDefault",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] === "" ? null : body[field];
      }
    }

    const [updatedAddress] = await db
      .update(addresses)
      .set(updateData)
      .where(
        and(eq(addresses.id, addressId), eq(addresses.customerId, customerId))
      )
      .returning();

    return NextResponse.json({ address: updatedAddress });
  } catch (error) {
    console.error("Failed to update address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

// DELETE /api/account/addresses/[id] - Delete an address
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const customerId = await getOrCreateCustomerId();

  if (!customerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const addressId = parseInt(id, 10);

  if (isNaN(addressId)) {
    return NextResponse.json({ error: "Invalid address ID" }, { status: 400 });
  }

  try {
    // Verify the address belongs to this customer and delete
    const result = await db
      .delete(addresses)
      .where(
        and(eq(addresses.id, addressId), eq(addresses.customerId, customerId))
      )
      .returning({ id: addresses.id });

    if (result.length === 0) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete address:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}
