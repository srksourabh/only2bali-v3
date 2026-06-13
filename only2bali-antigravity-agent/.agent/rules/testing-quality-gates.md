# Rule: Autonomous Testing & Quality Gates (Activation: Glob — src/**, app/**, tests/**, e2e/**)

## Test Generation (autonomous, no prompting needed)
- Every core module: Vitest unit tests written ALONGSIDE the implementation.
- Every user-facing flow: Playwright e2e spec (search → results → detail → booking).
- Provider integrations: contract tests against recorded fixtures — never live provider calls in CI.

## Coverage Gates
- State-handling and payment/booking flows: ≥ 95% (hard gate).
- Everything else: ≥ 80%.

## Failure-Path Testing (mandatory)
Every circuit breaker, timeout, and fallback must have a test proving the degraded state renders correctly. A resilience mechanism without a failing-dependency test does not exist.

## Verification Definition of Done
1. `vitest run` green  2. `playwright test` green (affected flows)  3. `tsc --noEmit` clean  4. lint clean  5. `next build` succeeds  6. bundle budget respected.

## Forbidden
Weakening assertions to pass · skipping/`.only` left in committed tests · mocking away the unit under test · coverage theatre (tests without meaningful assertions).
