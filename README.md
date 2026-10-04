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
  still run. See `AGENTS.md`'s "Lesson requirements" for the exact
  required contents (before/after scripts, dedicated `sandbox/`,
  README structure).
- `docs/incidents.md` — dangerous agent behavior observed while building this
- `docs/plan/` — specs for planned extensions, written before any code exists

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

Each lesson has two runnable entry points — one naive/unguarded, one
after the fix or optimization — and its own `README.md` documenting
the goal, what was expected before running each (**Before**), what
actually happened (**After**) — including failures, e.g. lesson 04's
context-limit crash and lesson 05's compaction loop — and the
conclusions carried forward into later lessons or into
`docs/incidents.md`. Full requirements: `AGENTS.md`.

## Planned: deep-dive tracks

Extensions to the main curriculum, going below the Claude API/SDK level
(local inference, raw protocols, infra). Full spec:
`docs/plan/deep-dive-tracks.md`. Not yet implemented — no `lessons/NN-<slug>/`
folders exist for these; code will live under `src/lessons/ollama/` and
`src/lessons/<tool>/`, docs under `docs/lessons/`, intentionally separate
from the `lessons/NN-<slug>/` folder naming used by lessons 01–05, though
the same lesson requirements apply (see `AGENTS.md`).

| Track | Title | Depends on | Status |
|---|---|---|---|
| O1 | Chat template | Ollama installed | planned |
| O2 | Tokenization & sampling | O1 | planned |
| O3 | KV cache & context window | O1 | planned |
| O4 | Loop portability / provider adapter | Stage 1 loop, O1–O3 | planned |
| T1 | llama.cpp (GGUF, quantization, grammars) | O1 | planned |
| T2 | Raw MCP (JSON-RPC over stdio/HTTP) | Lesson 10 | planned |
| T3 | Sandboxing & process isolation | Stage 1 loop | planned |
| T4 | Observability (OpenTelemetry) | Stage 1 loop | planned |
| T5 | pgvector / embeddings | Stage 3–4 | planned |
| T6 | Temporal / durable execution | Stage 3–4 | planned |
| T7 | vLLM (NVIDIA only) | O3 | planned, conditional |

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