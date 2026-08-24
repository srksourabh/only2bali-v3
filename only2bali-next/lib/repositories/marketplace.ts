import { and, asc, desc, eq, gt, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import {
  booking,
  message,
  messageThread,
  offer,
  requestBoardView,
  traveller,
  tripRequest,
  vendor,
} from "@/lib/db/schema";
import type { MessageInput, ProviderBidInput, TripRequestCreateInput } from "@/lib/validators/marketplace";
import { DEFAULT_PLATFORM_FEE_RATE, resolveCommissionRate } from "@/lib/payments/fee";

/** Vendor sets net; platform derives traveller-facing total. Never invert this. */
export function deriveTravellerTotal(vendorNetAmount: number, commissionRate: number): number {
  const rate = Number.isFinite(commissionRate) ? commissionRate : DEFAULT_PLATFORM_FEE_RATE;
  const safe = Math.min(Math.max(rate, 0), 0.9);
  return Math.ceil(vendorNetAmount / (1 - safe));
}

export function maskContacts(body: string): { masked: string; detected: boolean } {
  const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const url = /\b(?:https?:\/\/|www\.)\S+/gi;
  const phone = /(?:\+?\d[\d\s().-]{7,}\d)/g;
  const masked = body
    .replace(email, "[email hidden until booking]")
    .replace(url, "[link hidden until booking]")
    .replace(phone, "[phone hidden until booking]");
  return { masked, detected: masked !== body };
}

function newBookingReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `O2B-${out.slice(0, 4)}-${out.slice(4, 8)}`;
}

async function getOrCreateTraveller(accountId: string) {
  let [row] = await db.select().from(traveller).where(eq(traveller.accountId, accountId)).limit(1);
  if (!row) {
    [row] = await db.insert(traveller).values({ accountId }).returning();
  }
  return row;
}

export async function createTravellerRequest(
  accountId: string,
  hasVerifiedMobile: boolean,
  input: TripRequestCreateInput
) {
  const profile = await getOrCreateTraveller(accountId);
  const publish = input.publishToProviders && hasVerifiedMobile;
  const bidsCloseAt = publish ? new Date(Date.now() + 7 * 86_400_000) : null;

  const [row] = await db
    .insert(tripRequest)
    .values({
      travellerId: profile.id,
      status: "submitted",
      protocol: input.protocol,
      tier: input.tier,
      groupSize: input.groupSize,
      crewType: input.crewType,
      rooms: input.rooms,
      fromDate: input.fromDate,
      toDate: input.toDate,
      flexibleMonth: input.flexibleMonth,
      nights: input.nights,
      departureCity: input.departureCity,
      interests: input.interests,
      kitchenRequired: input.kitchenRequired,
      cookRequired: input.cookRequired,
      preferredLanguage: input.preferredLanguage,
      notes: input.notes,
      visibility: publish ? "open_to_verified" : "private",
      publishedAt: publish ? new Date() : null,
      bidsCloseAt,
      budgetMinAmount: input.budgetMinAmount,
      budgetMaxAmount: input.budgetMaxAmount,
      budgetCurrency: input.budgetCurrency,
      budgetBasis: input.budgetBasis,
      specialRequirements: input.specialRequirements,
      requirementTags: input.requirementTags,
      mobileVerified: hasVerifiedMobile,
    })
    .returning();

  return { request: row, publishedToProviders: publish };
}

export async function createProviderBid(
  vendorId: string,
  requestId: string,
  input: ProviderBidInput
) {
  const [provider] = await db
    .select({
      id: vendor.id,
      verificationStatus: vendor.verificationStatus,
      commissionRate: vendor.commissionRate,
    })
    .from(vendor)
    .where(eq(vendor.id, vendorId))
    .limit(1);
  if (!provider || provider.verificationStatus !== "verified") return { ok: false as const, reason: "provider_not_verified" };

  const [request] = await db
    .select({
      id: tripRequest.id,
      visibility: tripRequest.visibility,
      status: tripRequest.status,
      bidsCloseAt: tripRequest.bidsCloseAt,
    })
    .from(tripRequest)
    .where(eq(tripRequest.id, requestId))
    .limit(1);
  if (!request) return { ok: false as const, reason: "request_not_found" };
  if (
    request.visibility === "private" ||
    (request.status !== "submitted" && request.status !== "quoted")
  ) {
    return { ok: false as const, reason: "request_closed" };
  }
  if (request.bidsCloseAt && request.bidsCloseAt.getTime() < Date.now()) {
    return { ok: false as const, reason: "request_closed" };
  }

  const commissionRate = resolveCommissionRate(provider.commissionRate, DEFAULT_PLATFORM_FEE_RATE);
  const totalAmount = deriveTravellerTotal(input.vendorNetAmount, commissionRate);

  const [thread] = await db
    .insert(messageThread)
    .values({ tripRequestId: requestId, vendorId })
    .returning({ id: messageThread.id });

  const [row] = await db
    .insert(offer)
    .values({
      tripRequestId: requestId,
      vendorId,
      origin: "vendor_bid",
      title: input.title,
      summary: input.summary,
      totalAmount,
      vendorNetAmount: input.vendorNetAmount,
      commissionRate: commissionRate.toFixed(4),
      currency: input.currency,
      pricePerPerson: input.pricePerPerson,
      lineItems: input.lineItems,
      inclusionsDelta: input.inclusionsDelta,
      dayPlan: input.dayPlan,
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
      status: "sent",
      submittedAt: new Date(),
    })
    .returning();

  return { ok: true as const, bid: row, threadId: thread.id };
}

async function canUseThread(accountId: string, role: "traveller" | "vendor" | "admin", threadId: string) {
  if (role === "admin") return true;

  const [row] = await db
    .select({
      vendorAccountId: vendor.accountId,
      travellerAccountId: traveller.accountId,
    })
    .from(messageThread)
    .leftJoin(vendor, eq(messageThread.vendorId, vendor.id))
    .leftJoin(tripRequest, eq(messageThread.tripRequestId, tripRequest.id))
    .leftJoin(traveller, eq(tripRequest.travellerId, traveller.id))
    .where(eq(messageThread.id, threadId))
    .limit(1);

  return role === "vendor" ? row?.vendorAccountId === accountId : row?.travellerAccountId === accountId;
}

export async function sendMarketplaceMessage(
  accountId: string,
  role: "traveller" | "vendor" | "admin",
  input: MessageInput
) {
  let threadId = input.threadId;

  if (!threadId) {
    const [existing] = await db
      .select({ id: messageThread.id })
      .from(messageThread)
      .where(and(
        eq(messageThread.tripRequestId, input.tripRequestId!),
        eq(messageThread.vendorId, input.vendorId!),
        input.bookingId ? eq(messageThread.bookingId, input.bookingId) : isNull(messageThread.bookingId)
      ))
      .limit(1);

    threadId = existing?.id;
    if (!threadId) {
      const [created] = await db
        .insert(messageThread)
        .values({
          tripRequestId: input.tripRequestId,
          vendorId: input.vendorId,
          bookingId: input.bookingId,
        })
        .returning({ id: messageThread.id });
      threadId = created.id;
    }
  }

  if (!(await canUseThread(accountId, role, threadId))) return { ok: false as const, reason: "forbidden" };

  const { masked, detected } = maskContacts(input.body);
  const [row] = await db
    .insert(message)
    .values({
      threadId,
      senderAccountId: accountId,
      bodyRaw: input.body,
      bodyMasked: masked,
      contactAttemptDetected: detected,
    })
    .returning();

  return { ok: true as const, message: row };
}

export async function findVendorIdForAccount(accountId: string) {
  const [row] = await db
    .select({ id: vendor.id })
    .from(vendor)
    .where(eq(vendor.accountId, accountId))
    .limit(1);
  return row?.id ?? null;
}

/** Open board for verified providers — no traveller contact details. */
export async function listOpenRequestBoard(vendorId: string, limit = 40) {
  const now = new Date();
  const rows = await db
    .select({
      id: tripRequest.id,
      protocol: tripRequest.protocol,
      tier: tripRequest.tier,
      groupSize: tripRequest.groupSize,
      nights: tripRequest.nights,
      fromDate: tripRequest.fromDate,
      toDate: tripRequest.toDate,
      flexibleMonth: tripRequest.flexibleMonth,
      departureCity: tripRequest.departureCity,
      interests: tripRequest.interests,
      kitchenRequired: tripRequest.kitchenRequired,
      cookRequired: tripRequest.cookRequired,
      preferredLanguage: tripRequest.preferredLanguage,
      budgetMinAmount: tripRequest.budgetMinAmount,
      budgetMaxAmount: tripRequest.budgetMaxAmount,
      budgetCurrency: tripRequest.budgetCurrency,
      budgetBasis: tripRequest.budgetBasis,
      specialRequirements: tripRequest.specialRequirements,
      requirementTags: tripRequest.requirementTags,
      bidsCloseAt: tripRequest.bidsCloseAt,
      publishedAt: tripRequest.publishedAt,
      status: tripRequest.status,
    })
    .from(tripRequest)
    .where(
      and(
        eq(tripRequest.visibility, "open_to_verified"),
        inArray(tripRequest.status, ["submitted", "quoted"]),
        or(isNull(tripRequest.bidsCloseAt), gt(tripRequest.bidsCloseAt, now))
      )
    )
    .orderBy(desc(tripRequest.publishedAt))
    .limit(limit);

  // Record a board view for the hottest request (first) so scraping signals work later.
  if (rows[0]) {
    await db.insert(requestBoardView).values({ tripRequestId: rows[0].id, vendorId, viewCount: 1 });
  }

  return rows;
}

export async function listTravellerRequests(accountId: string, limit = 40) {
  const [profile] = await db.select({ id: traveller.id }).from(traveller).where(eq(traveller.accountId, accountId)).limit(1);
  if (!profile) return [];
  return db
    .select({
      id: tripRequest.id,
      status: tripRequest.status,
      protocol: tripRequest.protocol,
      groupSize: tripRequest.groupSize,
      fromDate: tripRequest.fromDate,
      toDate: tripRequest.toDate,
      nights: tripRequest.nights,
      visibility: tripRequest.visibility,
      budgetMinAmount: tripRequest.budgetMinAmount,
      budgetMaxAmount: tripRequest.budgetMaxAmount,
      budgetCurrency: tripRequest.budgetCurrency,
      createdAt: tripRequest.createdAt,
      bidsCloseAt: tripRequest.bidsCloseAt,
    })
    .from(tripRequest)
    .where(eq(tripRequest.travellerId, profile.id))
    .orderBy(desc(tripRequest.createdAt))
    .limit(limit);
}

export async function listOffersForRequest(
  requestId: string,
  accountId: string,
  role: "traveller" | "vendor" | "admin"
) {
  if (role === "traveller") {
    const [profile] = await db.select({ id: traveller.id }).from(traveller).where(eq(traveller.accountId, accountId)).limit(1);
    if (!profile) return { ok: false as const, reason: "forbidden" };
    const [req] = await db
      .select({ travellerId: tripRequest.travellerId })
      .from(tripRequest)
      .where(eq(tripRequest.id, requestId))
      .limit(1);
    if (!req || req.travellerId !== profile.id) return { ok: false as const, reason: "forbidden" };
  } else if (role === "vendor") {
    const vendorId = await findVendorIdForAccount(accountId);
    if (!vendorId) return { ok: false as const, reason: "forbidden" };

    const rows = await db
      .select({
        id: offer.id,
        title: offer.title,
        summary: offer.summary,
        totalAmount: offer.totalAmount,
        vendorNetAmount: offer.vendorNetAmount,
        currency: offer.currency,
        origin: offer.origin,
        status: offer.status,
        rank: offer.rank,
        score: offer.score,
        submittedAt: offer.submittedAt,
        validUntil: offer.validUntil,
        vendorId: offer.vendorId,
        businessName: vendor.businessName,
        vendorSlug: vendor.slug,
        ratingAvg: vendor.ratingAvg,
        ratingCount: vendor.ratingCount,
      })
      .from(offer)
      .leftJoin(vendor, eq(offer.vendorId, vendor.id))
      .where(and(eq(offer.tripRequestId, requestId), eq(offer.vendorId, vendorId)))
      .orderBy(asc(offer.rank), asc(offer.totalAmount));
    return { ok: true as const, offers: rows };
  }

  const rows = await db
    .select({
      id: offer.id,
      title: offer.title,
      summary: offer.summary,
      totalAmount: offer.totalAmount,
      currency: offer.currency,
      origin: offer.origin,
      status: offer.status,
      rank: offer.rank,
      score: offer.score,
      submittedAt: offer.submittedAt,
      validUntil: offer.validUntil,
      vendorId: offer.vendorId,
      businessName: vendor.businessName,
      vendorSlug: vendor.slug,
      ratingAvg: vendor.ratingAvg,
      ratingCount: vendor.ratingCount,
    })
    .from(offer)
    .leftJoin(vendor, eq(offer.vendorId, vendor.id))
    .where(
      and(
        eq(offer.tripRequestId, requestId),
        inArray(offer.status, ["sent", "viewed", "shortlisted", "accepted", "revision_requested"])
      )
    )
    .orderBy(asc(offer.rank), asc(offer.totalAmount));

  return { ok: true as const, offers: rows };
}

export async function acceptOffer(accountId: string, offerId: string) {
  const [profile] = await db.select().from(traveller).where(eq(traveller.accountId, accountId)).limit(1);
  if (!profile) return { ok: false as const, reason: "forbidden" };

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: offer.id,
        tripRequestId: offer.tripRequestId,
        vendorId: offer.vendorId,
        totalAmount: offer.totalAmount,
        vendorNetAmount: offer.vendorNetAmount,
        commissionRate: offer.commissionRate,
        currency: offer.currency,
        status: offer.status,
        title: offer.title,
      })
      .from(offer)
      .where(eq(offer.id, offerId))
      .limit(1)
      .for("update");

    if (!row || !row.vendorId) return { ok: false as const, reason: "offer_not_found" };
    if (!["sent", "viewed", "shortlisted", "revision_requested"].includes(row.status)) {
      return { ok: false as const, reason: "offer_not_open" };
    }

    const [req] = await tx
      .select({ id: tripRequest.id, travellerId: tripRequest.travellerId, groupSize: tripRequest.groupSize })
      .from(tripRequest)
      .where(eq(tripRequest.id, row.tripRequestId))
      .limit(1)
      .for("update");
    if (!req || req.travellerId !== profile.id) return { ok: false as const, reason: "forbidden" };

    const commissionRate = resolveCommissionRate(row.commissionRate, DEFAULT_PLATFORM_FEE_RATE);
    const gross = row.totalAmount;
    const net = row.vendorNetAmount ?? Math.floor(gross * (1 - commissionRate));
    const commissionAmount = gross - net;

    await tx.update(offer).set({ status: "accepted" }).where(eq(offer.id, offerId));
    await tx
      .update(offer)
      .set({ status: "declined", declineReason: "Another offer accepted" })
      .where(and(eq(offer.tripRequestId, row.tripRequestId), ne(offer.id, offerId), ne(offer.status, "withdrawn")));

    await tx
      .update(tripRequest)
      .set({ status: "booked", closedAt: new Date(), closeReason: "offer_accepted", updatedAt: new Date() })
      .where(eq(tripRequest.id, row.tripRequestId));

    const [created] = await tx
      .insert(booking)
      .values({
        reference: newBookingReference(),
        tripRequestId: row.tripRequestId,
        offerId: row.id,
        travellerId: profile.id,
        vendorId: row.vendorId,
        pax: req.groupSize,
        grossAmount: gross,
        currency: row.currency,
        commissionRate: commissionRate.toFixed(4),
        commissionAmount,
        netAmount: net,
        status: "pending_payment",
      })
      .returning({
        id: booking.id,
        reference: booking.reference,
        grossAmount: booking.grossAmount,
        currency: booking.currency,
      });

    // Unmask path: attach booking to existing thread if any.
    await tx
      .update(messageThread)
      .set({ bookingId: created!.id })
      .where(and(eq(messageThread.tripRequestId, row.tripRequestId), eq(messageThread.vendorId, row.vendorId)));

    return { ok: true as const, booking: created!, offerTitle: row.title };
  });
}

export async function declineOffer(accountId: string, offerId: string, reason?: string) {
  const [profile] = await db.select({ id: traveller.id }).from(traveller).where(eq(traveller.accountId, accountId)).limit(1);
  if (!profile) return { ok: false as const, reason: "forbidden" };

  const [row] = await db
    .select({
      id: offer.id,
      tripRequestId: offer.tripRequestId,
      status: offer.status,
      travellerId: tripRequest.travellerId,
    })
    .from(offer)
    .innerJoin(tripRequest, eq(offer.tripRequestId, tripRequest.id))
    .where(eq(offer.id, offerId))
    .limit(1);

  if (!row || row.travellerId !== profile.id) return { ok: false as const, reason: "forbidden" };
  if (!["sent", "viewed", "shortlisted", "revision_requested"].includes(row.status)) {
    return { ok: false as const, reason: "offer_not_open" };
  }

  const [updated] = await db
    .update(offer)
    .set({ status: "declined", declineReason: reason ?? "Declined by traveller" })
    .where(eq(offer.id, offerId))
    .returning();
  return { ok: true as const, offer: updated };
}

export async function listMessageThreads(accountId: string, role: "traveller" | "vendor" | "admin") {
  if (role === "admin") {
    return db
      .select({
        id: messageThread.id,
        tripRequestId: messageThread.tripRequestId,
        vendorId: messageThread.vendorId,
        bookingId: messageThread.bookingId,
        status: messageThread.status,
        createdAt: messageThread.createdAt,
        businessName: vendor.businessName,
      })
      .from(messageThread)
      .leftJoin(vendor, eq(messageThread.vendorId, vendor.id))
      .orderBy(desc(messageThread.createdAt))
      .limit(50);
  }

  if (role === "vendor") {
    const vendorId = await findVendorIdForAccount(accountId);
    if (!vendorId) return [];
    return db
      .select({
        id: messageThread.id,
        tripRequestId: messageThread.tripRequestId,
        vendorId: messageThread.vendorId,
        bookingId: messageThread.bookingId,
        status: messageThread.status,
        createdAt: messageThread.createdAt,
        businessName: vendor.businessName,
      })
      .from(messageThread)
      .leftJoin(vendor, eq(messageThread.vendorId, vendor.id))
      .where(eq(messageThread.vendorId, vendorId))
      .orderBy(desc(messageThread.createdAt))
      .limit(40);
  }

  const [profile] = await db.select({ id: traveller.id }).from(traveller).where(eq(traveller.accountId, accountId)).limit(1);
  if (!profile) return [];
  return db
    .select({
      id: messageThread.id,
      tripRequestId: messageThread.tripRequestId,
      vendorId: messageThread.vendorId,
      bookingId: messageThread.bookingId,
      status: messageThread.status,
      createdAt: messageThread.createdAt,
      businessName: vendor.businessName,
    })
    .from(messageThread)
    .innerJoin(tripRequest, eq(messageThread.tripRequestId, tripRequest.id))
    .leftJoin(vendor, eq(messageThread.vendorId, vendor.id))
    .where(eq(tripRequest.travellerId, profile.id))
    .orderBy(desc(messageThread.createdAt))
    .limit(40);
}

export async function listMessagesForThread(
  accountId: string,
  role: "traveller" | "vendor" | "admin",
  threadId: string
) {
  if (!(await canUseThread(accountId, role, threadId))) return { ok: false as const, reason: "forbidden" };

  const [thread] = await db
    .select({
      id: messageThread.id,
      bookingId: messageThread.bookingId,
      bookingStatus: booking.status,
    })
    .from(messageThread)
    .leftJoin(booking, eq(messageThread.bookingId, booking.id))
    .where(eq(messageThread.id, threadId))
    .limit(1);

  const unmasked =
    role === "admin" ||
    (thread?.bookingId != null &&
      thread.bookingStatus != null &&
      ["confirmed", "in_progress", "completed"].includes(thread.bookingStatus));

  const rows = await db
    .select({
      id: message.id,
      senderAccountId: message.senderAccountId,
      bodyRaw: message.bodyRaw,
      bodyMasked: message.bodyMasked,
      contactAttemptDetected: message.contactAttemptDetected,
      sentAt: message.sentAt,
    })
    .from(message)
    .where(eq(message.threadId, threadId))
    .orderBy(asc(message.sentAt))
    .limit(200);

  return {
    ok: true as const,
    unmasked,
    messages: rows.map((m) => ({
      id: m.id,
      senderAccountId: m.senderAccountId,
      body: unmasked ? m.bodyRaw : m.bodyMasked,
      contactAttemptDetected: m.contactAttemptDetected,
      sentAt: m.sentAt,
    })),
  };
}
