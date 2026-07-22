# Deploying @FullStackLead in Google Antigravity IDE

## Package Contents

| File | Type | Activation |
|---|---|---|
| `AGENTS.md` | Master spec (cross-tool: Antigravity, Cursor, Claude Code) | Auto-read from repo root |
| `.agent/rules/architect-core.md` | Identity + cognition loop + self-correction | Always On |
| `.agent/rules/performance-budgets.md` | SLOs, caching, resilience, security | Always On |
| `.agent/rules/testing-quality-gates.md` | Test generation + coverage gates | Glob: `src/**, app/**, tests/**, e2e/**` |
| `.agent/workflows/goal.md` | `/goal` — autonomous execution loop | Manual via `/` |
| `.agent/workflows/grill-me.md` | `/grill-me` — adversarial design review | Manual via `/` |
| `.agent/workflows/perf-audit.md` | `/perf-audit` — predictive perf audit | Manual via `/` |

All files are under Antigravity's 12,000-character-per-file limit.

## Step-by-Step Deployment

### Step 1 — Copy files into your repo
Copy `AGENTS.md` and the `.agent/` folder into the **root of your only2bali.com workspace** (the git root). Antigravity auto-discovers:
- Workspace rules: `<workspace>/.agent/rules/`
- Workspace workflows: `<workspace>/.agent/workflows/`
- `AGENTS.md` at repo root (applied after `GEMINI.md`; conflicts defer to `GEMINI.md`)

```bash
cp -r only2bali-antigravity-agent/AGENTS.md only2bali-antigravity-agent/.agent /path/to/only2bali/
```

### Step 2 — Verify registration in the IDE
1. Open the workspace in Antigravity.
2. In the Agent panel, click the `...` (top-right) → **Customizations**.
3. Open the **Rules** tab — the 3 rules should appear as Workspace rules. If creating manually instead: click **+ Workspace** and paste each file's content.
4. Open the **Workflows** tab — `goal`, `grill-me`, `perf-audit` should be listed.

### Step 3 — Set activation modes
For each rule in the Rules panel, set:
- `architect-core` → **Always On**
- `performance-budgets` → **Always On**
- `testing-quality-gates` → **Glob** with pattern `src/**,app/**,tests/**,e2e/**` (adjust to your layout)

### Step 4 — (Optional) Promote identity to Global
If you want @FullStackLead across all workspaces, append `architect-core.md` content to `~/.gemini/GEMINI.md` (global rules). Keep SLO budgets workspace-level — they are only2bali-specific.
Global workflows live at `~/.gemini/antigravity/global_workflows/` if needed.

### Step 5 — Configure agent autonomy
In Antigravity settings, set the Agent's review policy to your comfort level. Recommended: terminal commands on **auto-execute allowlist** for `vitest`, `tsc`, `next build`, `playwright test`; **require approval** for `git push`, deploys, and package installs — this mirrors the Decision Authority Matrix.

### Step 6 — Smoke test
1. In agent chat type: `/grill-me add a live currency-conversion widget calling an external FX API on every search result row` → expect a halt + alternatives verdict table.
2. Type: `/goal add a cached destination-highlights section to the homepage` → expect decomposition → design note → implementation with tests → verification report.
3. Ask for any trivial fix → confirm the agent still runs the Cognition Loop (observe/model before editing).

### Step 7 — Commit
Commit `AGENTS.md` and `.agent/` to git so every engineer (and every Antigravity session) inherits the same agent brain.

## Maintenance
- Tune SLO numbers as real RUM data arrives (budgets are enforcement hooks, not decoration).
- After a good multi-step session, ask Antigravity to "generate a Workflow from this conversation" to grow the workflow library.
- Keep each file < 12,000 chars or Antigravity will truncate/reject it.
