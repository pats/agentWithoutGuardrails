# agentWithoutGuardrails

A hand-built Claude tool-use agent loop on the raw Messages API — no
Agent SDK abstractions. Learning project for understanding agentic
loops, tool use, and safety mechanics at a low level.

## Setup

```bash
pnpm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
pnpm dev
```

## Structure

- `src/index.ts` — main agent loop
- `src/tools.ts` / `src/executeTool.ts` — tool definitions and execution
- `src/security.ts` / `src/protectedFiles.ts` — safety layers
- `src/lessons/` — standalone scripts on specific mechanics, see `docs/lessons/`
- `sandbox/<NN-lesson-name>/` — disposable files scoped to one lesson,
  never the real project data. Each lesson gets its own subdirectory so
  runs don't leak state into each other (see `docs/incidents.md`,
  Incident 5, for what happens when they share one)
- `docs/incidents.md` — dangerous agent behavior observed while building this

## Lessons

The scripts in `src/lessons/` build on each other and are meant to be worked
through **in order**, not picked at random — each one assumes the mechanics
from earlier lessons are already understood, and some reuse fixtures or
safety layers hardened in previous steps.

| # | Script | Write-up | Run | Start tag | Done tag |
|---|---|---|---|---|---|
| 01 | `src/lessons/streaming.ts` | `docs/lessons/01-streaming.md` | `pnpm run lesson:01` | `lesson-01-streaming-start` | `lesson-01-streaming-done` |
| 02 | `src/lessons/systemPrompt.ts` | `docs/lessons/02-system-prompt.md` | `pnpm run lesson:02` | `lesson-02-system-prompt-start` | `lesson-02-system-prompt-done` |
| 03 | `src/lessons/sandboxIncident.ts` | `docs/lessons/03-sandbox-incident.md` | `pnpm run lesson:03` | `lesson-03-sandbox-incident-start` | `lesson-03-sandbox-incident-done` |
| 04 | `src/lessons/tokenCounting.ts`<br>`src/lessons/generateFixtures.ts` | `docs/lessons/04-token-counting.md` | `pnpm run lesson:04` | `lesson-04-token-counting-start` | `lesson-04-token-counting-done` |

Each write-up documents the goal, what was expected before running
(**Before**), what actually happened (**After**) — including failures,
e.g. lesson 04's context-limit crash — and the conclusions carried
forward into later lessons or into `docs/incidents.md`.

### Reproducibility

Every lesson has two git tags: **start** (repo state right before that
lesson's code existed — check this out to redo the exercise from
scratch) and **done** (finished code, docs, and conclusions — check
this out to see the final result). `git checkout lesson-04-token-counting-start`
gets you the blank slate; `git checkout lesson-04-token-counting-done`
gets you the finished lesson.

Note: `lesson-01-streaming-start` predates the lesson entirely, but
`lesson-02-system-prompt-start` and `lesson-03-sandbox-incident-start`
point to the *same* commit — those two lessons were introduced together
in one commit historically, so there's no way to isolate "before 02"
from "before 03" individually. Both `-done` tags for 02/03 also share
one commit for the same reason. From lesson 04 onward this is clean:
each lesson gets its own start commit (before you begin) and its own
done commit (`feat:` + `docs:`, then tag both), before moving to the
next (see `AGENTS.md`).

## Commands

- `pnpm dev` — run the main agent loop
- `pnpm check` — format and lint with Biome
- `pnpm exec tsx src/lessons/<file>.ts` — run an individual lesson

## Safety notes

This agent has file read/write access. Two independent layers restrict it:
`isPathSafe` keeps writes inside the project directory, and `isProtectedFile`
blocks writes to specific sensitive files (`.env` and similar) regardless of
path formatting or letter case. Both were hardened after real incidents —
see `docs/incidents.md`.

## Contributing / AI assistants

See `AGENTS.md` for conventions and safety context before making changes.
Agents operate in read-only/review mode in this repo — see `AGENTS.md` for
details.