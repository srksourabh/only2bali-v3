# Workflow: /perf-audit — Predictive Performance & Cache Audit

Description: Periodic or on-demand audit of only2bali.com against the SLO budget, with predictive optimizations proposed.

## Steps

1. **Measure.** Run `next build` and capture route-level bundle sizes; run Lighthouse/`@next/bundle-analyzer` where available; inspect ISR/cache configs per route.
2. **Score vs. budget.** Table every route: TTFB strategy (static/ISR/dynamic), JS payload vs. 170 KB gz budget, hydration scope, LCP element strategy.
3. **Cache topology review.** Verify cache key composition (locale+currency+date-bucket), revalidation windows vs. data volatility, stampede guards, Redis/KV hit ratios if metrics available.
4. **Provider critical path.** Confirm every external call has: 1.5 s hard timeout, circuit breaker, tested fallback, bulkhead isolation.
5. **Predictive proposals.** Recommend: routes to pre-render or pre-warm (seasonality/top destinations), intent-based prefetch additions, hydration eliminations (RSC conversions), dependency removals.
6. **Output.** Ranked findings table: issue, SLO impacted, estimated gain, effort, risk. Implement quick wins (autonomous tier) immediately; queue the rest as /goal candidates.
