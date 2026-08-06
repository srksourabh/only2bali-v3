import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { vendorDocument } from "@/lib/db/schema";

export type VendorDocumentRow = typeof vendorDocument.$inferSelect;
export type DocumentKind = VendorDocumentRow["kind"];
export type DocumentReviewStatus = "pending" | "approved" | "rejected";

export async function listDocumentsForVendor(vendorId: string): Promise<VendorDocumentRow[]> {
  return db
    .select()
    .from(vendorDocument)
    .where(eq(vendorDocument.vendorId, vendorId))
    .orderBy(desc(vendorDocument.createdAt));
}

export async function listPendingDocuments(limit = 100): Promise<VendorDocumentRow[]> {
  return db
    .select()
    .from(vendorDocument)
    .where(eq(vendorDocument.status, "pending"))
    .orderBy(desc(vendorDocument.createdAt))
    .limit(limit);
}

export async function listRecentDocuments(limit = 80): Promise<VendorDocumentRow[]> {
  return db
    .select()
    .from(vendorDocument)
    .orderBy(desc(vendorDocument.createdAt))
    .limit(limit);
}

export async function addVendorDocument(input: {
  vendorId: string;
  kind: DocumentKind;
  fileUrl: string;
}): Promise<VendorDocumentRow> {
  const [row] = await db
    .insert(vendorDocument)
    .values({
      vendorId: input.vendorId,
      kind: input.kind,
      fileUrl: input.fileUrl,
      status: "pending",
    })
    .returning();
  return row!;
}

export async function reviewVendorDocument(input: {
  documentId: string;
  status: Extract<DocumentReviewStatus, "approved" | "rejected">;
  reviewerAccountId: string;
}): Promise<VendorDocumentRow | null> {
  const [row] = await db
    .update(vendorDocument)
    .set({
      status: input.status,
      reviewedBy: input.reviewerAccountId,
      reviewedAt: new Date(),
    })
    .where(and(eq(vendorDocument.id, input.documentId), eq(vendorDocument.status, "pending")))
    .returning();
  return row ?? null;
}

export async function getVendorDocumentById(id: string): Promise<VendorDocumentRow | null> {
  const [row] = await db.select().from(vendorDocument).where(eq(vendorDocument.id, id)).limit(1);
  return row ?? null;
}
