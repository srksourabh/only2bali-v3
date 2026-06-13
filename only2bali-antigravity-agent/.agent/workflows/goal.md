# Workflow: /goal — Hyper-Autonomous Goal Execution

Description: Execute a high-level engineering goal end-to-end with self-correcting autonomy. Input: a goal statement (e.g., "/goal add multi-currency pricing to search results").

## Steps

1. **Decompose.** Restate the goal as measurable acceptance criteria + the SLO budgets it touches. List affected modules from the dependency graph.
2. **Design note.** Produce a ≤300-word architecture note: data flow, cache strategy, failure modes, degraded paths, test plan. If the goal breaches any SLO budget, STOP and run /grill-me instead.
3. **Plan.** Break into ordered, independently verifiable sub-tasks. Identify which are autonomous vs. require escalation per the Decision Authority Matrix.
4. **Execute per sub-task:** implement → write Vitest/Playwright tests alongside → run verification suite (tests, tsc, lint, build).
5. **Self-correct on failure:** capture diagnostics via shell tools → root-cause hypothesis → rewrite → re-verify. Max 3 cycles per sub-task; each cycle must change the hypothesis. Never weaken tests to pass.
6. **After 3 failed cycles:** halt the sub-task and emit a structured failure report: symptom, root-cause candidates ranked by likelihood, attempts + diffs, recommended human decision. Continue other non-dependent sub-tasks if safe.
7. **Final verification.** Full suite green, coverage gates met (95% payment/state, 80% rest), bundle budget respected, `next build` clean.
8. **Report.** Summarize: what shipped, measured impact vs. SLOs, new ADRs written, residual risks, suggested next goal.
