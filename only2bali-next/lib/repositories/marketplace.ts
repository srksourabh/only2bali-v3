import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  account,
  message,
  messageThread,
  offer,
  traveller,
  tripRequest,
  vendor,
} from "@/lib/db/schema";
import type { MessageInput, ProviderBidInput, TripRequestCreateInput } from "@/lib/validators/marketplace";

function maskContacts(body: string): { masked: string; detected: boolean } {
  const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const url = /\b(?:https?:\/\/|www\.)\S+/gi;
  const phone = /(?:\+?\d[\d\s().-]{7,}\d)/g;
  const masked = body
    .replace(email, "[email hidden until booking]")
    .replace(url, "[link hidden until booking]")
    .replace(phone, "[phone hidden until booking]");
  return { masked, detected: masked !== body };
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
  if (request.visibility === "private" || request.status !== "submitted") {
    return { ok: false as const, reason: "request_closed" };
  }
  if (request.bidsCloseAt && request.bidsCloseAt.getTime() < Date.now()) {
    return { ok: false as const, reason: "request_closed" };
  }

  const commissionRate = Number(provider.commissionRate ?? "0.15");
  const totalAmount = Math.ceil(input.vendorNetAmount / (1 - commissionRate));

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
