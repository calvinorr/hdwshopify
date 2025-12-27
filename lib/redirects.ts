import { createClient } from "@libsql/client";

// Create a lightweight client for edge middleware
// This avoids importing the full drizzle setup which may have Node.js dependencies
const getEdgeClient = () => {
  const isLocalDb = process.env.DATABASE_URL?.startsWith("file:");
  return createClient({
    url: process.env.DATABASE_URL!,
    authToken: isLocalDb ? undefined : process.env.DATABASE_AUTH_TOKEN,
  });
};

export interface RedirectResult {
  toPath: string;
  statusCode: number;
}

/**
 * Look up a redirect for a given path
 * Edge-compatible - uses raw SQL instead of Drizzle
 */
export async function lookupRedirect(fromPath: string): Promise<RedirectResult | null> {
  try {
    const client = getEdgeClient();

    const result = await client.execute({
      sql: `SELECT to_path, status_code FROM redirects WHERE from_path = ? AND active = 1 LIMIT 1`,
      args: [fromPath],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // Increment hit counter (fire and forget, don't await)
    client.execute({
      sql: `UPDATE redirects SET hits = hits + 1, updated_at = CURRENT_TIMESTAMP WHERE from_path = ?`,
      args: [fromPath],
    }).catch(() => {
      // Ignore errors from hit tracking
    });

    return {
      toPath: row.to_path as string,
      statusCode: (row.status_code as number) || 301,
    };
  } catch (error) {
    // Log error but don't break the request
    console.error("Redirect lookup error:", error);
    return null;
  }
}

/**
 * Check if a path should be checked for redirects
 * We only check certain path patterns to avoid unnecessary DB lookups
 */
export function shouldCheckRedirect(pathname: string): boolean {
  // Only check product and collection paths, plus any path starting with /old-
  return (
    pathname.startsWith("/products/") ||
    pathname.startsWith("/collections/") ||
    pathname.startsWith("/old-") ||
    pathname.startsWith("/pages/")
  );
}
