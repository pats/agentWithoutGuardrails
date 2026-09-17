# 05 — Proactive Context Compaction

**File:** `contextWindowManagement.ts` (this folder)
**Helper:** `src/contextCompaction.ts` (`compactHistory()`)

## Goal

Lesson 04 showed a hard crash at the real 200k-token context limit, with
all progress lost. This lesson implements *proactive* compaction —
summarize the history before the limit is hit, not after — and checks
whether that actually lets the agent complete a task that would
otherwise crash.

## Prerequisites

Lesson 04 completed. Sandbox fixtures, isolated to this lesson:

```bash
pnpm exec tsx lessons/05-context-compaction/generateFixtures.ts
```

## Run

```bash
pnpm run lesson:05
```

## Before

Hypothesis, before running: proactive compaction at 75% of the context
limit (150,000 tokens) should keep the agent under the real 200k wall
and let it finish the task, instead of crashing the way lesson 04 did.

## After

Fixtures: `access-log-en.txt` (431.3 KB, 4000 lines), `access-log-pl.txt`
(484.4 KB, 4000 lines), `audit-log-en.txt` (647.0 KB, 6000 lines) — same
shape as lesson 04, regenerated into this lesson's own sandbox.

| Iteration | Heuristic | Actual  | What happened |
|-----------|----------:|--------:|---|
| 1         |       234 |     757 | `list_files` |
| 2         |       352 |     873 | reads all 3 files (parallel) |
| 3         |   352,668 | 547,219 | **compaction fires** → reduced to 1,112 tokens |
| 4         |       757 |   1,239 | `list_files` again |
| 5         |   353,072 | 547,584 | reads all 3 again → **compaction fires** → 1,295 tokens |
| 6         |       910 |   1,414 | `list_files` again |
| 7         |   353,224 | 547,759 | reads all 3 again → **compaction fires** → 1,061 tokens |
| 8         |       706 |   1,185 | `list_files` again |
| 9         |   353,022 | 547,532 | reads all 3 again → **compaction fires** → 1,155 tokens |
| 10        |       810 |   1,274 | `list_files` again — loop cap reached |

**The task never completed.** `lessons/05-context-compaction/sandbox/summary.txt`
was never written. The agent repeated the same list → read → compact
cycle for all 10 iterations. Every compaction summary claimed no prior
work existed (e.g. *"No prior work has been done on this task"*, *"No
earlier work completed yet"*) — so each cycle restarted from scratch.
Root cause and full analysis: `docs/incidents.md`, Incident 6.

## Conclusions

1. Reducing token count and preserving task continuity are two
   different problems. This implementation solved the first
   (547k → ~1.2k tokens, every time) and broke the second — the agent
   lost track of having done anything at all.
2. The failure is invisible from the token metrics alone: right after
   every compaction, the numbers look perfectly healthy (under 1.5k
   tokens). Nothing in the token count signals that context was lost —
   you only notice by seeing the task never finish.
3. Truncating a serialized transcript by raw character count is not
   structure-aware. Here it reliably cut through tool-call boundaries,
   leaving the summarizer a fragment with no framing to summarize
   correctly.
4. This isn't an argument against proactive compaction — the 200k hard
   crash from lesson 04 is still strictly worse (zero chances, total
   loss) than this softer failure (10 chances, at least a legible
   trace of what went wrong). It's an argument that compaction needs
   its own correctness check, not just a token-count check.

## Next

Make truncation structure-aware (cut at message/tool-result boundaries,
never mid-JSON) or summarize each large `tool_result` individually as
it's added to history, before the transcript ever gets this large.
Re-run this same experiment afterward and confirm `summary.txt` is
actually written.
