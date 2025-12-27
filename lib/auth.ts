import { auth, currentUser } from "@clerk/nextjs/server";
import { db, customers } from "@/lib/db";
import { eq } from "drizzle-orm";

// Check if Clerk is configured
const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured =
  clerkPubKey &&
  clerkPubKey.startsWith("pk_") &&
  !clerkPubKey.includes("placeholder");

/**
 * Get the current authenticated customer from the database.
 * Returns null if not authenticated or customer not found.
 */
export async function getCurrentCustomer() {
  if (!isClerkConfigured) return null;

  try {
    const { userId } = await auth();
    if (!userId) return null;

    const customer = await db.query.customers.findFirst({
      where: eq(customers.clerkId, userId),
      with: {
        addresses: true,
        orders: {
          orderBy: (orders, { desc }) => [desc(orders.createdAt)],
          limit: 10,
        },
      },
    });

    return customer ?? null;
  } catch {
    // Clerk not available
    return null;
  }
}

/**
 * Get just the Clerk user ID without database lookup.
 */
export async function getAuthUserId(): Promise<string | null> {
  if (!isClerkConfigured) return null;

  try {
    const { userId } = await auth();
    return userId;
  } catch {
    return null;
  }
}

/**
 * Get Clerk user details.
 */
export async function getClerkUser() {
  if (!isClerkConfigured) return null;

  try {
    const user = await currentUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Find or create a customer from Clerk user data.
 * Used when a user signs up or signs in.
 */
export async function findOrCreateCustomer(clerkId: string, email: string, firstName?: string | null, lastName?: string | null) {
  // Check if customer already exists
  let customer = await db.query.customers.findFirst({
    where: eq(customers.clerkId, clerkId),
  });

  if (customer) {
    return customer;
  }

  // Check if customer exists by email (guest who created account)
  customer = await db.query.customers.findFirst({
    where: eq(customers.email, email.toLowerCase()),
  });

  if (customer) {
    // Link existing customer to Clerk
    await db
      .update(customers)
      .set({ clerkId, firstName: firstName ?? customer.firstName, lastName: lastName ?? customer.lastName })
      .where(eq(customers.id, customer.id));

    return { ...customer, clerkId };
  }

  // Create new customer
  const [newCustomer] = await db
    .insert(customers)
    .values({
      clerkId,
      email: email.toLowerCase(),
      firstName: firstName ?? null,
      lastName: lastName ?? null,
    })
    .returning();

  return newCustomer;
}
