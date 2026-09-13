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
- `sandbox/` — disposable files for destructive experiments, never the real project data
- `docs/incidents.md` — dangerous agent behavior observed while building this

## Lessons

The scripts in `src/lessons/` build on each other and are meant to be worked
through **in order**, not picked at random — each one assumes the mechanics
from earlier lessons are already understood, and some reuse fixtures or
safety layers hardened in previous steps.

| # | Script | Write-up |
|---|---|---|
| 01 | `src/lessons/streaming.ts` | `docs/lessons/01-streaming.md` |
| 02 | `src/lessons/systemPrompt.ts` | `docs/lessons/02-system-prompt.md` |
| 03 | *(sandbox incident reproduction)* | `docs/lessons/03-sandbox-incident.md` |
| 04 | `src/lessons/tokenCounting.ts`<br>`src/lessons/generateFixtures.ts` | `docs/lessons/04-token-counting.md` |

Each write-up documents the goal, what actually happened running the
script — including failures, e.g. lesson 04's context-limit crash — and
the takeaways carried forward into later lessons or into `docs/incidents.md`.

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