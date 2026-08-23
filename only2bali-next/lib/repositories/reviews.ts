import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { isSchemaLagError } from "@/lib/db/schema-lag";
import { booking, review, traveller, vendor } from "@/lib/db/schema";
import type { CreateReviewInput } from "@/lib/validators/reviews";

const RATEABLE = new Set(["completed", "confirmed"]);

export async function listPublishedVendorReviews(vendorId: string, limit = 20) {
  try {
    return await db
      .select({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        foodComplianceKept: review.foodComplianceKept,
        createdAt: review.createdAt,
        direction: review.direction,
      })
      .from(review)
      .where(
        and(
          eq(review.vendorId, vendorId),
          eq(review.direction, "traveller_to_vendor"),
          eq(review.published, true)
        )
      )
      .orderBy(desc(review.createdAt))
      .limit(limit);
  } catch (err) {
    if (!isSchemaLagError(err)) throw err;
    const rows = await db
      .select({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        foodComplianceKept: review.foodComplianceKept,
        createdAt: review.createdAt,
      })
      .from(review)
      .where(and(eq(review.vendorId, vendorId), eq(review.published, true)))
      .orderBy(desc(review.createdAt))
      .limit(limit);
    return rows.map((row) => ({ ...row, direction: "traveller_to_vendor" as const }));
  }
}

async function rollupVendorRating(vendorId: string) {
  const [stats] = await db
    .select({
      avg: sql<string>`round(avg(${review.rating})::numeric, 2)`,
      count: sql<number>`count(*)::int`,
    })
    .from(review)
    .where(
      and(
        eq(review.vendorId, vendorId),
        eq(review.direction, "traveller_to_vendor"),
        eq(review.published, true)
      )
    );

  await db
    .update(vendor)
    .set({
      ratingAvg: stats?.avg ?? null,
      ratingCount: stats?.count ?? 0,
      updatedAt: new Date(),
    })
    .where(eq(vendor.id, vendorId));
}

export async function createReview(accountId: string, role: string, input: CreateReviewInput) {
  const [row] = await db.select().from(booking).where(eq(booking.id, input.bookingId)).limit(1);
  if (!row) {
    throw Object.assign(new Error("Booking not found."), { status: 404 });
  }
  if (!RATEABLE.has(row.status)) {
    throw Object.assign(new Error("Reviews open only after the trip is confirmed or completed."), {
      status: 400,
    });
  }

  if (input.direction === "traveller_to_vendor") {
    if (role !== "traveller" && role !== "admin") {
      throw Object.assign(new Error("Only travellers can rate providers."), { status: 403 });
    }
    const [t] = await db.select().from(traveller).where(eq(traveller.accountId, accountId)).limit(1);
    if (!t || row.travellerId !== t.id) {
      throw Object.assign(new Error("You can only review your own booking."), { status: 403 });
    }
    if (!row.vendorId) {
      throw Object.assign(new Error("This booking has no provider to rate."), { status: 400 });
    }

    const [created] = await db
      .insert(review)
      .values({
        bookingId: row.id,
        direction: "traveller_to_vendor",
        vendorId: row.vendorId,
        packageId: row.packageId,
        reviewerAccountId: accountId,
        revieweeAccountId: (
          await db.select({ accountId: vendor.accountId }).from(vendor).where(eq(vendor.id, row.vendorId)).limit(1)
        )[0]?.accountId,
        rating: input.rating,
        foodComplianceKept: input.foodComplianceKept ?? null,
        comment: input.comment?.trim() || null,
        published: true,
      })
      .returning();

    await rollupVendorRating(row.vendorId);
    return created;
  }

  // vendor_to_traveller
  if (role !== "vendor" && role !== "admin") {
    throw Object.assign(new Error("Only providers can rate travellers."), { status: 403 });
  }
  const [v] = await db.select().from(vendor).where(eq(vendor.accountId, accountId)).limit(1);
  if (!v || row.vendorId !== v.id) {
    throw Object.assign(new Error("You can only review bookings assigned to you."), { status: 403 });
  }
  if (!row.travellerId) {
    throw Object.assign(new Error("This booking has no traveller to rate."), { status: 400 });
  }

  const [t] = await db.select().from(traveller).where(eq(traveller.id, row.travellerId)).limit(1);
  const reviewee = t?.accountId ?? null;

  const [created] = await db
    .insert(review)
    .values({
      bookingId: row.id,
      direction: "vendor_to_traveller",
      vendorId: v.id,
      packageId: row.packageId,
      reviewerAccountId: accountId,
      revieweeAccountId: reviewee,
      rating: input.rating,
      comment: input.comment?.trim() || null,
      published: true,
    })
    .returning();

  return created;
}
