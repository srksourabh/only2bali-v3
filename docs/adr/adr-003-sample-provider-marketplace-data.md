# ADR-003: Isolated Sample Provider Marketplace Data

## Status

Accepted.

## Context

Only2Bali needs realistic sample data for provider enrollment and traveler inquiry demos across restaurants, travel agents, circuit-based agents and quality ride providers. The data must cover provider photos, events, promotions, listings, payout accounts, traveler inquiries, provider bids, marketplace chat, bookings, payments and disbursement records.

## Decision

Sample marketplace data is loaded by `npm run db:seed:samples` from `only2bali-next/lib/db/seed-sample-marketplace.ts`. It first refreshes the base catalogue seed, then recreates only records marked with `@sample.only2bali.com`, `sample-` provider slugs and `O2B-SAMPLE-` booking references.

The sample set stores traveler-facing money in INR and provider payout currency on payout/disbursement rows, so the INR collection and cross-currency vendor payout model is visible in local demos without connecting a live gateway.

## Consequences

The sample loader is safe to rerun against a database that also contains real providers, because it never deletes unmarked rows. Future sample rows must keep the same three markers, and payment rows must remain gateway-like records with opaque IDs rather than storing bank or card details.
