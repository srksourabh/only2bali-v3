# Only2Bali SaaS shipment audit — 23 August 2026

## Executive result

The application is safe to ship as a moderated Bali and Indonesia travel and food marketplace. Traveller, vendor and admin responsibilities are separated at both page and API level. Vendors can create services, prices and photo records; admins must verify the vendor and approve content before it becomes public; signed-out visitors can browse but cannot book; signed-in travellers can book; and all prices are recalculated by the server.

Two optional production capabilities remain deliberately unavailable until their external provider setup is finished: Razorpay checkout is paused until the real dashboard webhook secret replaces the placeholder, and direct file uploads are paused until separate public-media and private-document Blob stores are connected. Vendors can still add public HTTPS image URLs without the media store. Neither missing provider setting causes an unsafe fallback.

## Verified scorecard

| Area | Result | Evidence |
|---|---|---|
| Traveller portal | Pass | OTP/password/Clerk session boundary, account access, catalogue browsing and signed-in booking exercised |
| Vendor portal | Pass | Vendor signup, isolated dashboard, listing, price and photo creation exercised |
| Admin moderation | Pass | Vendor verification, listing activation and photo approval exercised through admin APIs |
| Role separation | Pass | Direct traveller-to-provider, vendor-to-admin and vendor-to-payment access attempts were refused or redirected |
| Public marketplace | Pass | Unapproved listing returned 404; approved listing and food detail page became public |
| Booking integrity | Pass | Anonymous booking refused; server ignored client amount; date/seat holds and oversell prevention verified |
| Razorpay safety | Pass, paused | Placeholder/URL webhook secret keeps order creation disabled and creates no payment row |
| Upload privacy | Pass, provider setup pending | Public media and private KYC use separate credentials; private reads are authenticated |
| Dependency security | Pass | `npm audit` reports 0 known vulnerabilities |
| Automated checks | Pass | 153 unit tests, 106 full HTTP/database checks, typecheck, schema check and production build |
| Performance budget | Pass at build gate | Largest listed route first-load JS is 124 kB; project budget is 170 kB gzipped |

## Production activation checklist

1. In Razorpay, create the webhook for `/api/payments/webhook`, subscribe to the documented payment events, and place its secret in `RAZORPAY_WEBHOOK_SECRET`.
2. In Vercel Blob, connect one public store for listing media and one private store for KYC documents, then set `BLOB_READ_WRITE_TOKEN` and `BLOB_PRIVATE_READ_WRITE_TOKEN` respectively.
3. Recheck `/api/health`: `payments.acceptingPayments` must be `true`, and both upload backends must be `vercel_blob` before advertising those capabilities.
4. Rotate every credential previously shared through chat, then replace the corresponding Vercel/Hostinger secret without committing it.
