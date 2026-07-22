# ADR-NNN: <short title of the decision>

> Copy this file to `adr-NNN-short-slug.md`, fill it in, and commit it alongside the
> code that implements the decision. Then add a one-line entry to the decision log in
> `docs/memory.md`.
>
> Write an ADR when a decision is expensive to reverse: a new dependency, a schema
> change, an auth or PII change, a new external service, or anything that changes how
> the four apps relate to each other. Do not write one for routine work.

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Accepted (in progress) | Superseded by ADR-NNN | Rejected
**Deciders**: <who made the call>

## Context

What is the situation? What forces are at play? Write this so that someone who joins in
a year understands *why this was even a question*, without needing the surrounding
conversation.

State constraints plainly: performance budgets, cost, deadlines, the fact that something
is already live and cannot break.

## Decision

What was decided. One or two sentences, in the active voice.

> We will …

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **A - <the chosen one>** | | |
| B - <alternative> | | |
| C - do nothing | | |

Include "do nothing" honestly. It is often the right answer, and if it was rejected the
reason belongs on the record.

## Consequences

**What gets better:**
-

**What gets worse, or costs us:**
-

**What this commits us to:**
-

**What we will need to revisit:**
-

Be honest about the downside. An ADR with no cons is not a decision, it is an
advertisement.

## Implementation notes

Anything the next person needs: files touched, migration steps, rollback plan, feature
flags, whether it can be reversed at all.
