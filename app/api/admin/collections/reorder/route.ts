import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/logger";
import { z } from "zod";

const reorderSchema = z.object({
  orderedIds: z.array(z.number()).min(1),
});

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const body = await request.json();
    const parseResult = reorderSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { orderedIds } = parseResult.data;

    // Update positions in a transaction
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(categories)
          .set({
            position: i,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(categories.id, orderedIds[i]));
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("collections.reorder", error);
    return NextResponse.json(
      { error: "Failed to reorder collections" },
      { status: 500 }
    );
  }
}
