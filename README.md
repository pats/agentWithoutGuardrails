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
- `lessons/NN-<slug>/` — the numbered curriculum. Each lesson is a
  **self-contained folder**: its own copy of every file it needs
  (script, any shared helpers like `executeTool.ts`/`tools.ts` it
  depends on, its own fixtures, its own `README.md` write-up). Nothing
  in `lessons/` imports from outside its own folder — you could copy
  any single `lessons/NN-<slug>/` folder out of this repo and it would
  still run.
- `docs/incidents.md` — dangerous agent behavior observed while building this

## Lessons

The folders under `lessons/` build on each other and are meant to be
worked through **in order**, not picked at random — each one assumes
the mechanics from earlier lessons are already understood, even though
each folder is technically self-contained and duplicates what it needs.

| # | Folder | Run |
|---|---|---|
| 01 | `lessons/01-streaming/` | `pnpm run lesson:01` |
| 02 | `lessons/02-system-prompt/` | `pnpm run lesson:02` |
| 03 | `lessons/03-sandbox-incident/` | `pnpm run lesson:03` |
| 04 | `lessons/04-token-counting/` | `pnpm run lesson:04` |
| 05 | `lessons/05-context-compaction/` | `pnpm run lesson:05` |

Each lesson's `README.md` documents the goal, what was expected before
running (**Before**), what actually happened (**After**) — including
failures, e.g. lesson 04's context-limit crash and lesson 05's
compaction loop — and the conclusions carried forward into later
lessons or into `docs/incidents.md`.

### Reproducibility

No git tags, no checkouts needed. Every lesson's finished code, fixtures,
and write-up live together, permanently, in its own folder on `main` —
open `lessons/04-token-counting/` and you're looking at the complete,
final state of lesson 04, right now, same as any other file in the repo.
"Before" isn't a separate checkout either — it's the **Before** section
in that lesson's `README.md`, written as a hypothesis before the code
existed, which is the part of "before" that actually matters (what you
expected to happen), not a literal snapshot of an empty file.

## Commands

- `pnpm dev` — run the main agent loop
- `pnpm check` — format and lint with Biome
- `pnpm run lesson:NN` — run a specific lesson (see table above)
- `./scripts/new-lesson.sh <NN> <kebab-slug> ["Title"]` — scaffold a new
  lesson folder

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