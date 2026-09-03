import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { lead, vendorApplication } from "@/lib/db/schema";
import type { LeadInput, VendorApplicationInput } from "@/lib/validators/leads";
import type { AdminLeadStatusInput } from "@/lib/validators/admin";

/**
 * Enquiries and provider applications, written before anything else happens.
 *
 * Both forms used to open a WhatsApp draft and nothing more, so a visitor who
 * closed the tab was a lead the business never knew existed. The row is now
 * written first; opening WhatsApp afterwards is a convenience, not the record.
 */
export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

export async function createLead(
  input: LeadInput,
  source: "web" | "planner" | "whatsapp" | "package_page" | "partner_referral",
  meta: RequestMeta = {}
): Promise<{ id: string }> {
  // The visitor may have chosen a food option that is not one of the three
  // protocols. Keep their words rather than forcing them into an enum.
  const notes = [
    input.message?.trim() || null,
    input.protocol === null && input.protocolLabel ? `Food preference: ${input.protocolLabel}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const [row] = await db
    .insert(lead)
    .values({
      source,
      name: input.name,
      mobile: input.mobile,
      email: input.email || null,
      departureCity: input.departureCity,
      groupSize: input.groupSize,
      protocol: input.protocol,
      travelMonth: input.travelMonth || null,
      message: notes || null,
      whatsappOptin: true,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })
    .returning({ id: lead.id });

  return row;
}

export async function createVendorApplication(
  input: VendorApplicationInput,
  meta: RequestMeta = {}
): Promise<{ id: string }> {
  const [row] = await db
    .insert(vendorApplication)
    .values({
      businessName: input.businessName,
      businessType: input.businessType,
      baseArea: input.baseArea,
      cuisine: input.cuisine || null,
      capabilities: input.capabilities,
      languages: input.languages
        ? input.languages.split(",").map((s) => s.trim()).filter(Boolean)
        : null,
      priceBand: input.priceBand || null,
      whatsapp: input.whatsapp,
      email: input.email || null,
      availability: input.availability || null,
      notes: input.notes || null,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })
    .returning({ id: vendorApplication.id });

  return row;
}

/** Admin's view of raw enquiries — nothing here is filtered by ownership. */
export async function listRecentLeads(limit = 80) {
  return db.select().from(lead).orderBy(desc(lead.createdAt)).limit(limit);
}

export async function adminSetLeadStatus(id: string, input: AdminLeadStatusInput) {
  const [row] = await db.update(lead).set({ status: input.status }).where(eq(lead.id, id)).returning();
  return row ?? null;
}
