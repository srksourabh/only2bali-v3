/**
 * Provider file storage.
 *
 * Production: Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set.
 * Local/dev: writes under `public/uploads/` so `next dev` can serve them.
 * Production without a blob token refuses uploads rather than pretending.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { list, put } from "@vercel/blob";

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
const EXT_CONTENT_TYPE = new Map(Object.entries(ALLOWED).map(([type, ext]) => [ext, type]));
const HANDLE_TTL_MS = 15 * 60_000;
/** Documents live outside `public/` so the dev server can never serve them statically. */
const LOCAL_PRIVATE_ROOT = ".uploads";

export type StoredUpload = {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
  backend: "vercel_blob" | "local";
};

export type PrivateStoredUpload = {
  ref: string;
  handle: string;
  contentType: string;
  size: number;
  access: "private";
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

function handleSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new UploadSetupError("AUTH_SECRET must be set (32+ chars) to handle document uploads.");
  }
  return s;
}

type DocumentHandlePayload = {
  p: string;
  v: string;
  b: "vercel_blob" | "local";
  c: string;
  exp: number;
};

/**
 * KYC documents are never exposed as fetchable URLs — the upload response
 * carries an HMAC-signed, short-lived handle instead. The client echoes the
 * handle when registering the document; the raw storage location is stored
 * server-side and only ever streamed through the authorized download route.
 */
export function mintDocumentHandle(input: {
  pathname: string;
  vendorId: string;
  backend: "vercel_blob" | "local";
  contentType: string;
}): string {
  const payload: DocumentHandlePayload = {
    p: input.pathname,
    v: input.vendorId,
    b: input.backend,
    c: input.contentType,
    exp: Date.now() + HANDLE_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", handleSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export type VerifiedDocumentHandle = DocumentHandlePayload;

export function verifyDocumentHandle(
  handle: string,
  vendorId: string
): VerifiedDocumentHandle | null {
  const dot = handle.indexOf(".");
  if (dot <= 0) return null;
  const body = handle.slice(0, dot);
  const sig = handle.slice(dot + 1);

  const expected = createHmac("sha256", handleSecret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: DocumentHandlePayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload?.p || !payload?.v || payload.exp < Date.now()) return null;
  if (payload.v !== vendorId) return null;
  return payload;
}

export async function storeUpload(
  file: File,
  opts: { folder: "media" | "documents"; vendorId: string }
): Promise<StoredUpload | PrivateStoredUpload> {
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
    if (opts.folder === "documents") {
      return {
        ref: pathname,
        handle: mintDocumentHandle({
          pathname,
          vendorId: opts.vendorId,
          backend: "vercel_blob",
          contentType: file.type,
        }),
        contentType: file.type,
        size: file.size,
        access: "private",
      };
    }
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

  if (opts.folder === "documents") {
    const dir = path.join(process.cwd(), LOCAL_PRIVATE_ROOT, "providers", opts.vendorId, opts.folder);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);
    return {
      ref: pathname,
      handle: mintDocumentHandle({
        pathname,
        vendorId: opts.vendorId,
        backend: "local",
        contentType: file.type,
      }),
      contentType: file.type,
      size: file.size,
      access: "private",
    };
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

const LEGACY_PUBLIC_UPLOADS = "public/uploads";

/**
 * Server-side stream for a stored document. Accepts the current pathname
 * references and legacy rows that still hold a blob URL or a /uploads path.
 * The caller must have authorized access; nothing here checks roles.
 */
export async function readDocumentBytes(fileUrl: string): Promise<{ bytes: Buffer; contentType: string } | null> {
  if (/^providers\/[a-zA-Z0-9._-]+\/documents\/[a-z0-9-]+\.(jpg|png|webp|pdf)$/.test(fileUrl)) {
    const ext = fileUrl.split(".").pop()!;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const matches = await list({ prefix: fileUrl, limit: 1 });
      const blob = matches.blobs.find((b) => b.pathname === fileUrl);
      if (!blob) return null;
      const res = await fetch(blob.url);
      if (!res.ok) return null;
      return {
        bytes: Buffer.from(await res.arrayBuffer()),
        contentType: EXT_CONTENT_TYPE.get(ext) ?? "application/octet-stream",
      };
    }
    if (process.env.NODE_ENV === "production") return null;
    try {
      const rel = fileUrl.replace(/^providers\//, "");
      return {
        bytes: await readFile(path.join(process.cwd(), LOCAL_PRIVATE_ROOT, rel)),
        contentType: EXT_CONTENT_TYPE.get(ext) ?? "application/octet-stream",
      };
    } catch {
      return null;
    }
  }

  if (/^https:\/\//.test(fileUrl)) {
    try {
      const res = await fetch(fileUrl);
      if (!res.ok) return null;
      return {
        bytes: Buffer.from(await res.arrayBuffer()),
        contentType: res.headers.get("content-type") ?? "application/octet-stream",
      };
    } catch {
      return null;
    }
  }

  const legacy = /^\/uploads\/providers\/([a-zA-Z0-9._-]+)\/documents\/([a-z0-9-]+\.(jpg|png|webp|pdf))$/.exec(fileUrl);
  if (legacy) {
    const ext = legacy[2].split(".").pop()!;
    try {
      return {
        bytes: await readFile(path.join(process.cwd(), LEGACY_PUBLIC_UPLOADS, "providers", legacy[1], "documents", legacy[2])),
        contentType: EXT_CONTENT_TYPE.get(ext) ?? "application/octet-stream",
      };
    } catch {
      return null;
    }
  }

  return null;
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
