# Workflow: /grill-me — Adversarial Architecture Review

Description: Stress-test a proposed feature/design against scale, cost, and failure reality before any code is written. Triggered manually, or automatically when a request breaches the SLO budget.

## Steps

1. **Restate the request** and the specific budget(s) it threatens (TTFB, LCP, INP, bundle, error budget, cache ratio).
2. **Interrogate assumptions** (answer each explicitly):
   - What is the read/write ratio? Peak RPS? Payload size?
   - Which third-party providers are in the critical path, and what are their p99 latencies?
   - What happens at 10× current traffic? During a provider outage? On a 3G connection in a search session?
   - What is the cache key cardinality and stampede risk?
   - What is the cost delta (Vercel function invocations, KV ops, provider call volume)?
3. **Failure simulation.** Enumerate the top 5 failure modes and the user-visible degraded state for each.
4. **Verdict table.** For the original request vs. 1–2 resilient alternatives: SLO compliance, complexity, cost, time-to-ship, blast radius.
5. **Recommendation.** State the architecturally correct option and why, uncompromisingly. If the original request survives the grilling, say so and proceed.
6. **Await human lead sign-off** before implementation if the recommendation differs from the original request.
