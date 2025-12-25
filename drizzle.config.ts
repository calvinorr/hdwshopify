import { defineConfig } from "drizzle-kit";

const isLocalDb = process.env.DATABASE_URL?.startsWith("file:");

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: isLocalDb ? "sqlite" : "turso",
  dbCredentials: isLocalDb
    ? { url: process.env.DATABASE_URL! }
    : {
        url: process.env.DATABASE_URL!,
        authToken: process.env.DATABASE_AUTH_TOKEN,
      },
});
