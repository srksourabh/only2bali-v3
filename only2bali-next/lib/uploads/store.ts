/**
 * Provider file storage.
 *
 * Production: Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set.
 * Local/dev: writes under `public/uploads/` so `next dev` can serve them.
 * Production without a blob token refuses uploads rather than pretending.
 */
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

export class UploadSetupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadSetupError";
  }
}

export class UploadValidationError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);

export type StoredUpload = {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
  backend: "vercel_blob" | "local";
};

export function uploadsConfigured(): boolean {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true;
  // Local filesystem fallback — never in production.
  return process.env.NODE_ENV !== "production";
}

function safeName(original: string, ext: string): string {
  const base = original
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  const id = randomBytes(8).toString("hex");
  return `${base || "file"}-${id}.${ext}`;
}

export async function storeUpload(
  file: File,
  opts: { folder: "media" | "documents"; vendorId: string }
): Promise<StoredUpload> {
  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new UploadValidationError("File must be between 1 byte and 8 MB.");
  }
  const ext = ALLOWED.get(file.type);
  if (!ext) {
    throw new UploadValidationError("Only JPEG, PNG, WebP and PDF uploads are allowed.");
  }

  const filename = safeName(file.name || "upload", ext);
  const pathname = `providers/${opts.vendorId}/${opts.folder}/${filename}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(pathname, bytes, {
      access: "public",
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type,
      size: file.size,
      backend: "vercel_blob",
    };
  }

  if (process.env.NODE_ENV === "production") {
    throw new UploadSetupError(
      "File uploads are not configured. Set BLOB_READ_WRITE_TOKEN (Vercel Blob)."
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads", "providers", opts.vendorId, opts.folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return {
    url: `/uploads/providers/${opts.vendorId}/${opts.folder}/${filename}`,
    pathname,
    contentType: file.type,
    size: file.size,
    backend: "local",
  };
}

/** Accept absolute https URLs or local /uploads paths produced by storeUpload. */
export function isAllowedStoredUrl(url: string): boolean {
  if (/^\/uploads\/providers\/[a-zA-Z0-9._\-/]+$/.test(url)) return true;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.length > 0;
  } catch {
    return false;
  }
}
