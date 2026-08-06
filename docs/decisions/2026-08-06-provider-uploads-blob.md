# ADR: Provider uploads use Vercel Blob with local filesystem fallback

**Date:** 2026-08-06
**Status:** Accepted

Provider media and KYC documents are uploaded via `POST /api/provider/uploads`
(multipart). Production requires `BLOB_READ_WRITE_TOKEN` (Vercel Blob); without
it the endpoint returns 503 rather than writing to an ephemeral serverless
filesystem. Local/dev writes under `public/uploads/` so `next dev` can serve
files without a blob account. Document metadata lands in `vendor_document` for
admin approve/reject; media still goes through `vendor_media` with the existing
approval gate.
