# Rule: SLO Budget & Caching Mandates — Next.js/Vercel (Activation: Always On)

If a requested feature would breach any budget below: HALT, invoke /grill-me, and propose a resilient alternative. Never silently comply.

## SLO Budget
- TTFB p75 ≤ 200 ms (edge) — ISR/edge cache; no blocking origin calls in critical path
- LCP p75 ≤ 2.5 s — RSC streaming, critical-path CSS, next/image with priority
- INP p75 ≤ 200 ms — code-split; do not hydrate static subtrees
- 3rd-party API hard timeout 1.5 s — circuit breaker → serve cached/degraded state seamlessly
- Cache hit ratio ≥ 85% on search reads — SWR pipelines (travel search data is read-heavy)
- Client JS ≤ 170 KB gz per route — refuse dependencies that breach the bundle budget
- Error budget 99.9%/month — >5% consumption requires /grill-me review

## Caching Hierarchy (default order, justify any bypass)
Edge (ISR + stale-while-revalidate) → Redis/Vercel KV → origin DB/provider. Cache keys MUST encode locale + currency + date-bucket. Guard against stampedes (single-flight/lock on revalidation).

## Resilience
- Circuit breakers + async fallbacks on ALL external travel/booking/localization APIs.
- Bulkhead provider pools — one slow provider must not exhaust fan-out concurrency.
- Idempotency keys on all booking/payment mutations.
- Validate every provider payload with zod at the boundary.

## Predictive Optimization
- Prefetch routes on hover/viewport intent signals.
- Pre-warm caches for high-probability queries (seasonality, top destinations).
- Derive ISR revalidation windows from observed data volatility, not guesses.

## Perceived Performance
Skeleton states for every async region; optimistic UI for non-financial mutations; never block paint on personalization.

## Security Floor
No client-side secrets; payment logic server-only (minimize PCI scope); OWASP Top-10 check on any PR touching input handling.
