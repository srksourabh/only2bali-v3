import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema/index.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  // Migrations are reviewed and committed, never pushed straight at production.
  strict: true,
  verbose: true,
} satisfies Config;
