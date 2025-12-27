import { NextResponse } from "next/server";
import { db, customers } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

// Check if Clerk is configured
const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured =
  clerkPubKey &&
  clerkPubKey.startsWith("pk_") &&
  !clerkPubKey.includes("placeholder");

async function getCustomer() {
  if (!isClerkConfigured) return null;

  try {
    const { userId } = await auth();
    if (!userId) return null;

    const customer = await db.query.customers.findFirst({
      where: eq(customers.clerkId, userId),
    });

    return customer ?? null;
  } catch {
    return null;
  }
}

// GET /api/account/profile - Get current profile
export async function GET() {
  const customer = await getCustomer();

  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    profile: {
      phone: customer.phone,
      acceptsMarketing: customer.acceptsMarketing,
    },
  });
}

// PATCH /api/account/profile - Update profile
export async function PATCH(request: Request) {
  const customer = await getCustomer();

  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.phone !== undefined) {
      updateData.phone = body.phone || null;
    }

    if (body.acceptsMarketing !== undefined) {
      updateData.acceptsMarketing = !!body.acceptsMarketing;
    }

    const [updatedCustomer] = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, customer.id))
      .returning();

    return NextResponse.json({
      profile: {
        phone: updatedCustomer.phone,
        acceptsMarketing: updatedCustomer.acceptsMarketing,
      },
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
