# ADR-007: Launch on Razorpay alone, keep the Stripe code

**Date**: 2026-08-25
**Status**: Accepted
**Deciders**: Sourabh

## Context

Both gateways are implemented. Razorpay has order creation, Checkout.js
verification, an idempotent webhook and a captured-payment path that the
end-to-end suite drives all the way through escrow to payout. Stripe has a
confirm route and a webhook and is wired into the same checkout, but has never
had a key set anywhere, is `checkoutConfigured: false` in production, and had
no test coverage at all until this change.

Leaving it in that state was not neutral. `/api/payments/options` is public and
names both gateways, so a traveller could see a payment method the platform
cannot actually take money through. Nobody had decided whether that was a bug
or a placeholder, which is the real problem: an unconfigured gateway that
nobody has ruled on looks identical to one somebody forgot.

The customers are Indian groups paying in INR. Razorpay is the domestic rail
and settles in INR. Stripe would earn its place the day there is non-INR
demand — a Bali-side provider billing in USD, or travellers outside India —
and not before.

## Decision

We will launch on Razorpay only, leave the Stripe implementation in the
codebase unconfigured, and require that an unconfigured gateway is *listed as
unavailable with a reason* rather than hidden or silently offered.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **A - keep the code, launch on Razorpay, surface Stripe as unavailable** | No dead code to resurrect later; the reason is visible to the traveller and to `/api/health`; one reconciliation surface at launch | A gateway exists in the tree that nobody exercises in production |
| B - configure Stripe too | Card coverage outside India from day one | A second webhook to secure, a second set of keys to rotate, a second reconciliation to get right, for customers who are all paying in INR |
| C - delete the Stripe code | Smallest surface | Throws away working code for a need that is likely within a year; re-adding it means re-securing a webhook from scratch |
| D - do nothing | No work | The public options endpoint keeps naming a gateway that cannot take money, and nobody knows whether that is deliberate |

## Consequences

**What gets better:**
- One payment path to reconcile, monitor and rotate keys for at launch.
- The gateway list is now honest: available, or unavailable with a stated
  reason. `BookingPayButton` refuses to start a checkout on an unavailable
  gateway rather than failing at the API.
- End-to-end coverage asserts that an unconfigured gateway is offered as
  unavailable *with* a reason, and that no key material appears in the public
  response.

**What gets worse, or costs us:**
- Stripe code ships untested against a live Stripe account. When it is turned
  on, it needs its own verification pass — the coverage added here proves the
  fail-closed behaviour, not that a real Stripe payment succeeds.
- Travellers outside India, or anyone without an Indian card, cannot pay.

**What this commits us to:**
- Keeping `/api/payments/options` truthful: any gateway named must be either
  available or accompanied by a reason it is not.
- `payments.stripe.acceptingPayments: false` in `/api/health` is expected, not
  a fault. `npm run verify:launch` treats it that way.

**What we will need to revisit:**
- The first non-INR provider or traveller. At that point Stripe gets keys, a
  webhook secret, and a verification pass of its own.

## Implementation notes

Nothing to migrate. `lib/payments/config.ts` already computes availability and
a blocking reason per gateway, `BookingPayButton` already refuses an
unavailable one, and `scripts/e2e.ts` now asserts both. Turning Stripe on later
is three environment variables — `STRIPE_SECRET_KEY`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` — and a
verification pass; no code change is expected.
