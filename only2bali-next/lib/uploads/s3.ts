/**
 * S3-compatible object storage, so the operator picks the vendor.
 *
 * Uploads spoke Vercel Blob and nothing else, which made "let providers upload
 * a photo" mean "be on a plan that includes Blob". Nearly every object store
 * speaks the S3 API, and the free tiers are generous:
 *
 *   Cloudflare R2    10 GB, no egress charge   <account>.r2.cloudflarestorage.com
 *   Backblaze B2     10 GB                     s3.<region>.backblazeb2.com
 *   MinIO            self-hosted               any host you run
 *
 * `aws4fetch` is a few kilobytes and signs with SigV4 over plain fetch, which
 * keeps this usable from a serverless function without pulling in the AWS SDK.
 *
 * Public media and private documents stay in separate buckets, exactly as they
 * are separate Blob stores today. That separation is what stops a guessable
 * listing-photo URL from reaching a vendor's passport scan, so the two are
 * configured independently and neither falls back to the other.
 */
import { AwsClient } from "aws4fetch";
import type { UploadFolder } from "./store";

export type S3Env = {
  S3_ENDPOINT?: string;
  S3_REGION?: string;
  S3_ACCESS_KEY_ID?: string;
  S3_SECRET_ACCESS_KEY?: string;
  S3_BUCKET_MEDIA?: string;
  S3_BUCKET_DOCUMENTS?: string;
  /** Public base URL for media, e.g. an R2 custom domain or r2.dev address. */
  S3_PUBLIC_BASE_URL?: string;
};

export type S3Config = {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string | null;
};

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function s3Config(folder: UploadFolder, env: S3Env = process.env as S3Env): S3Config | null {
  const endpoint = clean(env.S3_ENDPOINT);
  const accessKeyId = clean(env.S3_ACCESS_KEY_ID);
  const secretAccessKey = clean(env.S3_SECRET_ACCESS_KEY);
  const bucket = clean(folder === "documents" ? env.S3_BUCKET_DOCUMENTS : env.S3_BUCKET_MEDIA);

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) return null;

  return {
    endpoint: endpoint.replace(/\/$/, ""),
    // R2 ignores the region but SigV4 still has to sign one, and "auto" is what
    // Cloudflare documents.
    region: clean(env.S3_REGION) ?? "auto",
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl: folder === "media" ? clean(env.S3_PUBLIC_BASE_URL)?.replace(/\/$/, "") ?? null : null,
  };
}

export function s3Configured(folder: UploadFolder, env: S3Env = process.env as S3Env): boolean {
  return s3Config(folder, env) !== null;
}

function client(config: S3Config): AwsClient {
  return new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
    region: config.region,
  });
}

export function objectUrl(config: S3Config, pathname: string): string {
  return `${config.endpoint}/${config.bucket}/${pathname}`;
}

/**
 * The URL a browser can fetch a public object from.
 *
 * Null when no public base is configured, which is deliberate: without one the
 * bucket is private, and returning the signed endpoint would hand out a URL
 * that works for nobody.
 */
export function publicUrl(config: S3Config, pathname: string): string | null {
  return config.publicBaseUrl ? `${config.publicBaseUrl}/${pathname}` : null;
}

export async function putObject(
  config: S3Config,
  pathname: string,
  bytes: Buffer | Uint8Array,
  contentType: string
): Promise<boolean> {
  const res = await client(config).fetch(objectUrl(config, pathname), {
    method: "PUT",
    headers: { "content-type": contentType, "content-length": String(bytes.byteLength) },
    body: new Uint8Array(bytes),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    console.error("[uploads] s3 put failed", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}

export async function getObject(
  config: S3Config,
  pathname: string
): Promise<{ bytes: Buffer; contentType: string } | null> {
  const res = await client(config).fetch(objectUrl(config, pathname), {
    method: "GET",
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) return null;

  return {
    bytes: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get("content-type") || "application/octet-stream",
  };
}
