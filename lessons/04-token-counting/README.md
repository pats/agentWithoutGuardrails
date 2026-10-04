# 04 — Token Counting & Context Window Limits

**Files:** `tokenCountingBefore.ts` (logs both token estimates but
never acts on them), `tokenCountingAfter.ts` (stops before
`create()` instead of letting the API reject an oversized request) —
this folder

## Goal

Understand how to actually count tokens in an agent's conversation history,
compare a cheap local heuristic against the exact API-based measurement, and
empirically observe what happens when the history exceeds the model's context
window.

## Prerequisites

Sandbox fixtures, isolated to this lesson's own subdirectory (never reuse
`lessons/03-sandbox-incident/sandbox/` here — that's what caused Incident 5, see
`docs/incidents.md`):

```bash
pnpm exec tsx lessons/04-token-counting/generateFixtures.ts
```

This writes `access-log-en.txt`, `access-log-pl.txt`, and
`audit-log-en.txt` into `lessons/04-token-counting/sandbox/`.

## Run

```bash
pnpm run lesson:04-before   # tokenCountingBefore.ts
pnpm run lesson:04-after    # tokenCountingAfter.ts
```

Both run the identical task against the identical fixtures and log the
same heuristic-vs-actual comparison every iteration (Methods A and B
below); `tokenCountingAfter.ts` additionally checks the real
(`countTokens()`) count against `CONTEXT_LIMIT` before every `create()`
call and stops the loop cleanly if it would exceed it, instead of
calling `create()` anyway and letting the API reject it.

## Before (before — `tokenCountingBefore.ts`)

Hypothesis / what to expect, before running:

- The 4:1 char/token heuristic will roughly track the real count for
  prose, but likely diverge for JSON-heavy content (`tools`, message
  structure)
- Reading several thousand-line log files in one step could plausibly
  push the conversation history toward the model's context limit
- If the limit is hit, the loop's error handling has never been
  tested against that specific failure — outcome unknown

## Method A: local heuristic

Zero-network-call approximation based on the "~4 characters = 1 token" rule:

```typescript
function estimateTokensHeuristic(text: string): number {
  return Math.ceil(text.length / 4);
}
```

Computed over `JSON.stringify()` of `system`, `messages`, and `tools` combined.

**Limitations discovered empirically:**
- The 4:1 rule holds reasonably well for natural English prose.
- For content dense with punctuation (JSON, e.g. `JSON.stringify(messages)`
  and `JSON.stringify(tools)`), the error is systematically large — in our
  tests the heuristic **underestimated** the real cost by 40-70%, mostly
  because tool definitions (`tools`) and JSON message structure tokenize
  worse than prose, and the BPE tokenizer has a higher cost per character
  here than the assumed 4:1.
- Conclusion: the character/token heuristic is not constant — it depends on
  the "shape" of the content. Fine for rough monitoring (dashboards, trends),
  not for a precise decision like "should I truncate the history."

## Method B: `client.messages.countTokens()`

A separate API endpoint, same parameters as `create()` (model, system, tools,
messages) minus `max_tokens`, returns exact `input_tokens` without generating
a response. Not billed (no output tokens generated) — the cost is extra
round-trip latency, not money.

## After (before — `tokenCountingBefore.ts`)

Sandbox: three generated log-style files (`generateFixtures.ts` (this folder))
— `access-log-en.txt` (4000 lines), `access-log-pl.txt` (4000 lines, same
data shape in Polish), `audit-log-en.txt` (6000 lines). Task: read all files
in `lessons/04-token-counting/sandbox/` and write a combined summary.

| Iteration | Heuristic | Actual (countTokens) | Error   |
|-----------|----------:|----------------------:|--------:|
| 1         |       223 |                    743 |  -70.0% |
| 2         |       345 |                    864 |  -60.1% |
| 3         |    390728 |                 600366 |  -34.9% |

Iteration 3: the agent read all three fixture files at once (`Promise.all`
across tool calls) — the history jumped from ~900 to over 600k tokens in a
single step. The `create()` call in that iteration failed with:

`BadRequestError: 400 prompt is too long: 600446 tokens > 200000 maximum`

**Empirically confirmed context window limit for `claude-haiku-4-5-20251001`:
200,000 tokens.** Not from documentation — from a real API error.

Effect of exceeding the limit: the whole loop crashes with an unhandled
exception, and **all progress from iteration 2 (5 `read_file` calls) is
lost** — nothing was written, since the agent never reached `write_file`.

## Side effect: Incident 5

During this experiment the agent independently read `sandbox/.env` (a file
left over from lesson 03, back when `sandbox/` was flat and shared across
lessons), because it matched the literal instruction "read all files." See
`docs/incidents.md`, Incident 5. Two independent things had to be true for
this to happen, and both are now fixed separately:

1. `isProtectedFile()` only guarded `write_file`, not `read_file` — fixed
   in code (`664c90c`).
2. `.env` was there at all only because lessons shared one `sandbox/`
   directory with no cleanup between runs — fixed by giving each lesson
   its own `sandbox/<NN-name>/` subdirectory (this doc's Prerequisites).

Neither fix alone is sufficient: the guard stops the read even if a stray
file is present; the isolation stops the stray file from being present in
the first place. Defense in depth, same principle as Incident 4.

## Before (after — `tokenCountingAfter.ts`)

Hypothesis / what to look for, before running:

- The loop should stop itself, with a clear `[guard]` log line, on
  whichever iteration's `actual` token count exceeds `CONTEXT_LIMIT`
  (200,000) — before calling `create()`, not after
- No unhandled `BadRequestError` this time; the run ends cleanly
- The guard adds no extra network round-trip — it reuses the same
  `countTokens()` result (`actual`) the unguarded run already computes
  and logs every iteration, it just acts on it

## After (after — `tokenCountingAfter.ts`)

*(placeholder — fill in with the actual `pnpm run lesson:04-after`
output once run; do not fill this in speculatively)*

## Conclusions

1. The character/token heuristic is useful for rough on-the-fly monitoring,
   but too inaccurate (30-70% error observed) to base a truncation decision
   on. Use `countTokens()` for that.
2. `countTokens()` is not free of cost in latency, but it is free of cost in
   money — use it before any request where staying under the context limit
   actually matters, not on every single iteration if latency is a concern.
3. A tool-use loop with no history management has no ceiling — nothing in
   the code caps how much a single set of parallel tool calls can add to the
   history. One broad instruction plus a handful of large files is enough to
   blow past 200k tokens in one step.
4. Hitting the limit is not a graceful degradation — it's a hard crash that
   discards the entire run's progress. This is the concrete case for the
   next lesson: proactive thresholds and truncation, applied *before* the
   request is sent, not reacted to after a 400.
5. Guardrails don't transfer across capabilities by default (see Incident 5)
   — a protected-file list scoped to `write_file` gave zero protection
   against the same file being read into context and resent to the API on
   every subsequent iteration.

6. *(fill in after running `lesson:04-after`: what the guard actually
   changes, and doesn't)*

## Next

Implement truncation on individual `tool_result` outputs, then a proactive
token-threshold check before `create()` — see next lesson.
