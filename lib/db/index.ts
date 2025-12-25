import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const isLocalDb = process.env.DATABASE_URL?.startsWith("file:");

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: isLocalDb ? undefined : process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

export * from "./schema";
