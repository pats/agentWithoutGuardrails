# NN — <Lesson title>

**Files:** `<name>Before.ts` (naive/unguarded/unoptimized), `<name>After.ts`
(fix/guard/optimization applied) — this folder. If both variants share
heavy setup, factor it into a local helper both import (e.g.
`lessons/05-context-compaction/tokenEstimation.ts`) rather than
duplicating it across the two files.

## Goal

What this lesson is trying to find out or build, and why — usually
motivated by a gap or open question left by the previous lesson.

## Prerequisites

What must already be true or set up before running this: earlier
lessons, generated fixtures, environment variables. If this lesson
needs fixtures, generate them into `sandbox/` inside this same folder
— never point at another lesson's folder or a shared top-level one.

## Run

```bash
pnpm run lesson:NN-before   # naive/unguarded
pnpm run lesson:NN-after    # fix/guard/optimization applied
```

Describe what actually differs between the two runs (same task, same
loop — only the one thing under test changes).

## Before (before/naive/unguarded — `<scriptBefore>.ts`)

Hypothesis — write this **before** you run anything, not after:

- What you expect to happen
- What you're specifically watching for in the output

## After (before/naive/unguarded — `<scriptBefore>.ts`)

What actually happened. Real output, real numbers — never invented
ones. If it didn't work as expected, say so plainly and explain why;
a documented failure with root-cause analysis is a valid, often more
valuable outcome than a clean success (see lesson 05). If it produced
a real incident, log it in `docs/incidents.md` and reference it here.

## Before (after — `<scriptAfter>.ts`)

Hypothesis for the fixed/guarded/optimized variant, written before
running it — usually "this should no longer reproduce the failure
above" plus what specifically should differ in the output.

## After (after — `<scriptAfter>.ts`)

Real, observed output for the fixed/guarded/optimized variant — never
invented. Say plainly if it only partially fixes the problem, or fixes
it in a way that introduces a new, different gap (see lesson 03:
`isProtectedFile` blocks `.env` but not `notes.txt`).

## Conclusions

What this proves or disproves, comparing both runs directly. Numbered
list preferred over prose — easier to carry forward into later lessons.

## Next

What this motivates for the next lesson, if anything. Delete this
section if there's no clear follow-up.
