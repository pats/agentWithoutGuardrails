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
- `docs/incidents.md` — dangerous agent behavior observed while building this