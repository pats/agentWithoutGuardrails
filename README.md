# agentWithoutGuardrails

Hand-built Claude tool-use agent loops on the raw Messages API — no
Agent SDK abstractions. Learning project for understanding agentic
loops, tool use, and safety mechanics at a low level.

## How to use this repo

Two distinct ways to *use* it as a learner — pick one per session, they
don't mix well:

1. **Guided, mentor mode.** Open a chat with an agent (e.g. Claude Code)
   with this repo attached, and have it walk you through a lesson step
   by step: which file to create, what to name it, what it should do,
   what command to run, what to expect. **You type the code yourself.**
   The committed `*Before.ts`/`*After.ts` files in each lesson folder
   are the answer key — don't open them until you've written your own
   attempt, or the exercise is pointless. In this mode, the agent's job
   is to describe the next step and react to your result, never to
   write or edit the lesson files for you — see `AGENTS.md`'s "Three
   contexts" section (context 1), which an agent should follow even if
   you ask it to "just write it," because that's the one thing that
   breaks this mode specifically.
2. **Self-serve verification.** Skip the exercise and just run a
   lesson's existing scripts directly (see the table below) to see the
   reference behavior quickly — e.g. to check your own from-scratch
   attempt against the committed one, or to just read the Before/After
   results without typing anything.

**In neither of these does an agent write to anything under `lessons/`.**
Actually editing or composing lesson content (fixing a lesson, adding
one, renaming files, the kind of change this repo's own history is
full of) is a third, separate context — repo maintenance, not use —
see `AGENTS.md`.

## Setup

```bash
pnpm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
pnpm run lesson:01-before
```

## Structure

There is no shared `src/` agent loop — every tool-use loop, its
`executeTool.ts`/`tools.ts`, and its safety layers (`security.ts`/
`protectedFiles.ts`) live inside the lesson that needs them. Start at
`lessons/01-streaming/` and work forward.

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

| # | Folder | Before | After |
|---|---|---|---|
| 01 | `lessons/01-streaming/` | `pnpm run lesson:01-before` | `pnpm run lesson:01-after` |
| 02 | `lessons/02-system-prompt/` | `pnpm run lesson:02-before` | `pnpm run lesson:02-after` |
| 03 | `lessons/03-sandbox-incident/` | `pnpm run lesson:03-before` | `pnpm run lesson:03-after` |
| 04 | `lessons/04-token-counting/` | `pnpm run lesson:04-before` | `pnpm run lesson:04-after` |
| 05 | `lessons/05-context-compaction/` | `pnpm run lesson:05-before` | `pnpm run lesson:05-after` |

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
| T5 | pgvector / embeddings | — (Stage 3–4 project) | planned |
| T6 | Temporal / durable execution | — (Stage 3–4 project) | planned |
| T7 | vLLM (NVIDIA only) | O3 | planned, conditional |

"Stage 1" above is lessons 01–05 (this repo, as it exists today).
Stages 2–4 and lessons 06–13, referenced throughout
`docs/plan/deep-dive-tracks.md` as dependencies/placement, are not
planned or documented anywhere yet — treat those specific numbers as
placeholders for a curriculum that doesn't exist beyond lesson 05.

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

- `pnpm check` — format and lint with Biome
- `pnpm run lesson:NN-before` / `pnpm run lesson:NN-after` — run a
  specific lesson's before/after entry point (see table above)

## Safety notes

Lessons that give the agent file read/write access guard it with two
independent layers, each lesson's own copy: `isPathSafe` keeps writes
inside the project directory, and `isProtectedFile` blocks writes to
specific sensitive files (`.env` and similar) regardless of path
formatting or letter case. Both were hardened after real incidents —
see `docs/incidents.md`.

## Contributing / AI assistants

See `AGENTS.md` for conventions and safety context before making changes.
Agents operate in read-only/review mode in this repo — see `AGENTS.md` for
details.