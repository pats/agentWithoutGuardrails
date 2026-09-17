# 02 — System prompt as a behavior lever

**File:** `src/lessons/systemPrompt.ts`

## Goal

Show that the same tool definitions and the same user prompt can
produce different **decisions** — not just different wording —
depending only on the `system` field sent with the request.

## Prerequisites

Lesson 01 (streaming) understood — this lesson reuses the plain
request/response loop, no streaming involved.

## Run

```bash
pnpm run lesson:02
```

This sends the identical task ("read notes.txt, write a summary")
through the same manual loop twice, changing only `system`: once with
a cautious, explain-first prompt, once with an autonomous,
act-without-asking prompt.

## Before

Hypothesis / what to look for, before running:

- How much text precedes each tool call in each variant
- Whether the model calls extra tools (e.g. `list_files`) to
  "understand context" before acting, in the cautious variant
- Number of iterations each variant takes to finish
- With an ambiguous instruction (e.g. "clean up this directory"
  instead of a precise one), the two variants can diverge sharply —
  including into destructive territory. See `03-sandbox-incident.md`.

## After

The cautious variant called `list_files` first and narrated its plan
before writing; the autonomous variant went straight to the write
with no explanation. Iteration count was lower for the autonomous
variant, at the cost of legibility.

## Conclusions

The system prompt shapes the agent's *plan*, not just its tone. The
effect is small on precise, single-path tasks and can be large on
ambiguous ones — because ambiguity is exactly where the model falls
back on whatever the system prompt told it about how to behave.

## Git tags

- Start: `lesson-02-system-prompt-start` (`7000094`) — repo state
  before lesson 02 or 03 code existed. **Note:** this is the shared
  starting point for both lessons 02 and 03 — they were both
  introduced in the same later commit, so there is no historical way
  to isolate "before 02" from "before 03" individually.
- Done: `lesson-02-system-prompt-done` (`b2e6ccd`) — finished code +
  docs
