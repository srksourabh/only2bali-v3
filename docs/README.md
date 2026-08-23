# Documentation

Start here. Everything below is written to be read by a person joining the
project, and by the AI agents that work in it.

## Read these first

| Document | What it answers |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | How the apps fit together, and where the traps are |
| [`memory.md`](memory.md) | Project context and decision log. **Read at the start of every session** |
| [`progress.md`](progress.md) | What is done, what is next, what is blocked |
| [`SECURITY.md`](SECURITY.md) | Threat model, current posture, outstanding risk |
| [`consolidation-audit-2026-08-23.md`](consolidation-audit-2026-08-23.md) | Which local folder and GitHub repo are canonical |

## Building

| Document | What it answers |
|---|---|
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Setup, workflow, conventions, PR checklist |
| [`DESIGN.md`](DESIGN.md) | Colour tokens, typography, the Indonesian motifs, accessibility floor |
| [`reference/seed-data.md`](reference/seed-data.md) | Salvaged supply data, and why most of it was discarded |

## Planning

The product specification and the sequenced work to get there.

| Document | What it answers |
|---|---|
| [`planning/marketplace-spec.md`](planning/marketplace-spec.md) | The full design: frontend, backend, database, PWA |
| [`planning/marketplace-tasks.md`](planning/marketplace-tasks.md) | Phase-level scope of record |
| [`planning/todo.md`](planning/todo.md) | **The execution list.** Sequenced, with commands and done-when criteria |
| [`planning/platform-plan.md`](planning/platform-plan.md) | The earlier marketplace build-out plan |
| [`planning/assumptions.md`](planning/assumptions.md) | Risky assumptions, and how to test them |
| [`planning/ideas.md`](planning/ideas.md) | Competitive feature backlog |
| [`planning/upgrade-plan-v1.md`](planning/upgrade-plan-v1.md) | Original step-by-step upgrade plan |
| [`planning/task-breakdown.md`](planning/task-breakdown.md) | Original task decomposition |
| [`planning/task-todo.md`](planning/task-todo.md) | Original checklist |

The last four predate the current specification. They are kept because they carry
reasoning that has not been restated elsewhere, not because they are current. When
they disagree with `marketplace-spec.md`, the specification wins.

## Decisions

[`adr/`](adr/) — architecture decision records. Copy
[`adr/adr-template.md`](adr/adr-template.md) for a new one, and commit it
alongside the change it describes.

## Status and risk

| Document | What it answers |
|---|---|
| [`security-fixes-status.md`](security-fixes-status.md) | What has actually been fixed, and what has not |
| [`agent-config/`](agent-config/) | Antigravity agent configuration |

> `security-fixes-status.md` previously claimed five fixes that were never applied
> to the running code. It has been rewritten to state what is true. The lesson it
> now carries is worth more than the file: **verify security claims against the
> code, never against a document.**

## Keeping this honest

Documentation that drifts is worse than none — it is trusted and wrong. Two rules:

1. When you change behaviour, change the document in the same commit.
2. When you find a document that is wrong, fix it or delete it. Do not leave it.
