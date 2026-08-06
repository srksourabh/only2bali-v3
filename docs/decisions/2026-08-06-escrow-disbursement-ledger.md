# ADR: Escrow hold and manual disbursement ledger

**Date:** 2026-08-06
**Status:** Accepted

On payment capture, create a `payment_disbursement` row in `held` status with
hold reason "Escrow until trip start / voucher issue". Admin releases hold,
approves, then marks paid after the bank/PA-CB rail settles. Purpose code
`S1301` is written on `payment_event` payloads. Live gateway transfer remains
blocked on the PA-CB partner contract (E0); the app records the ledger path
without inventing a cross-border rail.
