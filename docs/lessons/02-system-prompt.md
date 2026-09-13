# Lesson 2 — System prompt as a behavior lever

**File:** `src/lessons/systemPrompt.ts`

**Run:** `pnpm exec tsx src/lessons/systemPrompt.ts`

## What this shows

Before touching any streaming or event-based API, the plain
request/response loop already reveals something important: the same
tool definitions and the same user prompt can produce different
**decisions** — not just different wording — depending only on the
`system` field sent with the request.

This script sends the identical task ("read notes.txt, write a
summary") through the same manual loop twice, changing only `system`:
once with a cautious, explain-first prompt, once with an autonomous,
act-without-asking prompt.

## What to look for

- How much text precedes each tool call in each variant
- Whether the model calls extra tools (e.g. `list_files`) to
  "understand context" before acting, in the cautious variant
- Number of iterations each variant takes to finish
- With an ambiguous instruction (e.g. "clean up this directory"
  instead of a precise one), the two variants can diverge sharply —
  including into destructive territory. See `03-sandbox-incident.md`.

## Key takeaway

The system prompt shapes the agent's *plan*, not just its tone. The
effect is small on precise, single-path tasks and can be large on
ambiguous ones — because ambiguity is exactly where the model falls
back on whatever the system prompt told it about how to behave.