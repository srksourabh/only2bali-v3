import { upsertAdminAccount } from "@/lib/repositories/admin";
import { bootstrapAdminSchema } from "@/lib/validators/admin";

async function main() {
  const parsed = bootstrapAdminSchema.safeParse({
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
    email: process.env.ADMIN_EMAIL ?? "",
  });
  if (!parsed.success) {
    console.error("Set ADMIN_USERNAME and ADMIN_PASSWORD with at least 10 characters.");
    process.exit(1);
  }

  const result = await upsertAdminAccount(parsed.data);
  console.log(`${result.created ? "created" : "updated"} admin account: ${result.username}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
