import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { account } from "./identity";

/**
 * Keyed platform knobs. First key: platform_fee_rate (decimal string, e.g. 0.1000).
 * Additive and tiny so admin can change the default take without a deploy.
 */
export const platformSetting = pgTable("platform_setting", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid("updated_by").references(() => account.id, { onDelete: "set null" }),
});
