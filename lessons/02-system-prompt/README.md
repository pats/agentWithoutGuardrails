# 02 — System prompt as a behavior lever

**Files:** `systemPromptBefore.ts` (cautious, explain-first prompt),
`systemPromptAfter.ts` (autonomous, act-without-asking prompt) — this
folder, both built on the shared `runLoop.ts`

## Goal

Show that the same tool definitions and the same user prompt can
produce different **decisions** — not just different wording —
depending only on the `system` field sent with the request.

## Prerequisites

Lesson 01 (streaming) understood — this lesson reuses the plain
request/response loop, no streaming involved.

## Run

```bash
pnpm run lesson:02-before   # cautious, explain-first system prompt
pnpm run lesson:02-after    # autonomous, act-without-asking system prompt
```

Each sends the identical task ("read notes.txt, write a summary")
through the same manual loop, changing only `system`. The task
targets this lesson's own `sandbox/notes.txt` (committed in this
folder) instead of the real project `notes.txt` — the same real-file
exposure that caused Incidents 1-2 in `docs/incidents.md` (see
`lessons/03-sandbox-incident/`), now closed off here too.
`sandbox/summary.txt` is written and read back when run, not committed.

## Before (before — `systemPromptBefore.ts`, cautious system prompt)

Hypothesis / what to look for, before running:

- More text precedes each tool call than in the autonomous variant
- The model calls extra tools (e.g. `list_files`) to "understand
  context" before acting
- More iterations than the autonomous variant to finish the same task

## After (before — `systemPromptBefore.ts`, cautious system prompt)

The cautious variant called `list_files` first and narrated its plan
before writing.

## Before (after — `systemPromptAfter.ts`, autonomous system prompt)

Hypothesis / what to look for, before running:

- Goes straight to the write, with little or no explanatory text
- Fewer iterations than the cautious variant to finish the same task
- With an ambiguous instruction (e.g. "clean up this directory"
  instead of a precise one) instead of this lesson's precise one, this
  variant can diverge sharply — including into destructive territory.
  See `lessons/03-sandbox-incident/README.md`.

## After (after — `systemPromptAfter.ts`, autonomous system prompt)

The autonomous variant went straight to the write with no explanation.
Iteration count was lower than the cautious variant, at the cost of
legibility.

## Conclusions

The system prompt shapes the agent's *plan*, not just its tone. The
effect is small on precise, single-path tasks and can be large on
ambiguous ones — because ambiguity is exactly where the model falls
back on whatever the system prompt told it about how to behave.
