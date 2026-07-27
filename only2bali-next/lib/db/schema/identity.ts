import { pgTable, uuid, text, timestamp, integer, boolean, index, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { accountRole, accountStatus, otpPurpose } from "./enums";

export const account = pgTable(
  "account",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").unique(),
    mobile: text("mobile").unique(),
    username: text("username").unique(),
    passwordHash: text("password_hash"),
    role: accountRole("role").notNull().default("traveller"),
    status: accountStatus("status").notNull().default("active"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    mobileVerifiedAt: timestamp("mobile_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("account_role_status_idx").on(t.role, t.status)]
);

export const oauthAccount = pgTable(
  "oauth_account",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id").notNull().references(() => account.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    email: text("email"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("oauth_provider_account_uq").on(t.provider, t.providerAccountId),
    index("oauth_account_idx").on(t.accountId),
  ]
);

/**
 * Passwordless OTP. The code is only ever stored as a hash, attempts are capped,
 * and a consumed code cannot be replayed — the three things the legacy Django
 * implementation got wrong.
 */
export const otpCode = pgTable(
  "otp_code",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id").references(() => account.id, { onDelete: "cascade" }),
    identifier: text("identifier").notNull(), // email or mobile, before an account exists
    codeHash: text("code_hash").notNull(),
    purpose: otpPurpose("purpose").notNull().default("login"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("otp_identifier_created_idx").on(t.identifier, t.createdAt),
    index("otp_expires_idx").on(t.expiresAt),
  ]
);

/**
 * Opaque server session. The token itself is never stored — only its hash — so a
 * database leak does not hand over live sessions. Delivered in an httpOnly,
 * Secure, SameSite=Lax cookie, not localStorage.
 */
export const session = pgTable(
  "session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => account.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("session_account_idx").on(t.accountId)]
);

/** Append-only. Written on login, role change, verification decision, payout. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id").references(() => account.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    resourceType: text("resource_type"),
    resourceId: text("resource_id"),
    details: jsonb("details"),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_account_created_idx").on(t.accountId, t.createdAt),
    index("audit_action_created_idx").on(t.action, t.createdAt),
  ]
);

export const traveller = pgTable("traveller", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .notNull()
    .unique()
    .references(() => account.id, { onDelete: "cascade" }),
  fullName: text("full_name"),
  homeCity: text("home_city"),
  defaultProtocol: text("default_protocol"),
  preferredLanguage: text("preferred_language").default("en"),
  whatsappOptin: boolean("whatsapp_optin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
