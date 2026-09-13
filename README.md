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

## Commands

- `pnpm dev` — run the main agent loop
- `pnpm check` — format and lint with Biome
- `pnpm exec tsx src/lessons/<file>.ts` — run an individual lesson

## Safety notes

This agent has file read/write access. Two independent layers restrict
it: `isPathSafe` keeps writes inside the project directory, and
`isProtectedFile` blocks writes to specific sensitive files (`.env` and
similar) regardless of path formatting or letter case. Both were
hardened after real incidents — see `docs/incidents.md`.