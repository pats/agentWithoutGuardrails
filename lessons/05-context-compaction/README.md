# 05 — Proactive Context Compaction

**Files:** `contextWindowManagementBefore.ts` (`runWithoutCompaction()`),
`contextWindowManagementAfter.ts` (`runWithCompaction()`) — this folder,
both built on the shared `tokenEstimation.ts`
**Helper:** `contextCompaction.ts` (`compactHistory()`, used by the after variant only)

## Goal

Lesson 04 showed a hard crash at the real 200k-token context limit, with
all progress lost. This lesson implements *proactive* compaction —
summarize the history before the limit is hit, not after — and checks
whether that actually lets the agent complete a task that would
otherwise crash. It also runs the same task with compaction switched
off, to see directly what compaction does and doesn't prevent, rather
than only inferring it from lesson 04.

## Prerequisites

Lesson 04 completed. Sandbox fixtures, isolated to this lesson:

```bash
pnpm exec tsx lessons/05-context-compaction/generateFixtures.ts
```

## Run

```bash
pnpm run lesson:05-before   # runWithoutCompaction() — 15-iteration cap
pnpm run lesson:05-after    # runWithCompaction() — 10-iteration cap
```

Both run the identical task, loop, and thresholds logged
(`tokenEstimation.ts`); `contextWindowManagementBefore.ts` never calls
`compactHistory()`, so its iteration cap is raised from 10 to 15 to give
it a realistic chance of actually hitting the real 200k-token limit (a
hard 400 error, as in lesson 04) instead of just stopping early on the cap.

## Before (before — `contextWindowManagementBefore.ts`, without compaction)

Hypothesis, before running: with `compactHistory()` never called, the
heuristic/actual token counts should climb past the 150k compaction
threshold (and past the `WARNING_THRESHOLD` at 90%) uninterrupted —
same growth curve the "with compaction" run shows right up to its
first compaction event, but continuing instead of resetting. With three
~1.5MB combined fixtures read every cycle the loop repeats, this should
realistically hit the real 200k-token limit (a hard 400 error) within
the 15-iteration cap, rather than completing the task or stopping on
the cap the way the compacted run does.

## After (before — `contextWindowManagementBefore.ts`, without compaction)

*(placeholder — fill in with the actual `pnpm run lesson:05-before`
output once run; do not fill this in speculatively)*

## Before (after — `contextWindowManagementAfter.ts`, with compaction)

Hypothesis, before running: proactive compaction at 75% of the context
limit (150,000 tokens) should keep the agent under the real 200k wall
and let it finish the task, instead of crashing the way lesson 04 did.

## After (after — `contextWindowManagementAfter.ts`, with compaction)

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

Point 5, comparing directly against the before/without-compaction run,
goes here once it's been run — see its After section above; not
pre-written, per this doc's own rule against invented output.

## Next

Make truncation structure-aware (cut at message/tool-result boundaries,
never mid-JSON) or summarize each large `tool_result` individually as
it's added to history, before the transcript ever gets this large.
Re-run this same experiment afterward and confirm `summary.txt` is
actually written.
