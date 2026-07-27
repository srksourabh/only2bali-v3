import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/crypto";

const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();

async function main() {
  if (!username || !password || password.length < 10) {
    console.error("Set ADMIN_USERNAME and ADMIN_PASSWORD with at least 10 characters.");
    process.exit(1);
  }

  const [existing] = await db.select({ id: account.id }).from(account).where(eq(account.username, username)).limit(1);

  if (existing) {
    await db
      .update(account)
      .set({
        passwordHash: hashPassword(password),
        email: email || null,
        role: "admin",
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(account.id, existing.id));
    console.log(`updated admin account: ${username}`);
  } else {
    await db.insert(account).values({
      username,
      passwordHash: hashPassword(password),
      email: email || null,
      role: "admin",
      status: "active",
    });
    console.log(`created admin account: ${username}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
