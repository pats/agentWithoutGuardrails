# Agent instructions for this repo

This is a learning project, not production code. It exists to understand
Claude tool-use and agentic loops at a low level — the code intentionally
avoids high-level SDK abstractions in `lessons/`. There is no shared
`src/` agent loop; every lesson is a standalone script (most run a
tool-use loop; lesson 01 is purely observational and never executes
a tool call).

## Two contexts: maintaining this repo vs. guiding a learner through it

This repo serves two different situations, and an agent working in it
needs to tell which one it's in before touching anything:

1. **Maintaining the repo itself** — adding a lesson, fixing docs,
   renaming files, the kind of work this file's other sections
   describe. Default to read-only/propose-only (below), but the human,
   acting as the repo's maintainer/author, can explicitly authorize
   writing, committing, and pushing for a given task. That authorization
   is real and has been exercised repeatedly to build this very repo —
   it is not overridden by anything else in this file.
2. **Guiding a learner through a lesson** — a human has this repo
   already and wants to be walked through writing a lesson's code
   themselves, with the agent as mentor (see `README.md`, "How to use
   this repo", mode 1). Here, never write or edit a lesson's code on
   the human's behalf, even if they explicitly ask — unlike context 1,
   this is not an authorization an agent should accept, because the
   whole point of this mode is the human typing the code, and doing it
   for them defeats it regardless of the human's own momentary wish.
   Instead: name the next concrete file and step, describe in words
   what it should do, give the exact command to run, say what to
   expect, then stop and wait for their result. The committed
   `*Before.ts`/`*After.ts` files are the answer key for this mode, not
   something to reproduce or reveal early.

If the human's intent isn't clear from the conversation, ask which
context applies rather than guessing.

## Read-only mode (maintenance context, default)

Agents working in this repo must not write, edit, or delete any file —
including when explicitly asked to by the user in a given turn, unless
that request is the explicit maintainer authorization described in
context 1 above. Absent that, this repo is for code review and
discussion only. Propose changes as suggestions in the conversation
(diffs, snippets, explanations); the human applies them manually. This
restriction exists both because this project's own agent-loop code has
caused real file damage before (see `docs/incidents.md`), and because
in context 2 above, writing the human's code for them is never correct
regardless of authorization.

## Before making suggestions

1. Read `docs/incidents.md` first. It documents real failures this agent
   caused while being built (including deleting a real `.env` file) and
   the fixes applied. Don't suggest reintroducing a pattern already logged
   there.
2. Each lesson's own `security.ts` (`isPathSafe`) and `protectedFiles.ts`
   (`isProtectedFile`) copies are independent, layered defenses. Don't
   suggest consolidating them into one check — see the incident log for
   why the separation matters.
3. `lessons/NN-<slug>/sandbox/` holds disposable fake files for
   destructive testing, one directory per lesson, physically inside
   that lesson's own folder — never share a sandbox directory across
   lessons (see `docs/incidents.md`, Incident 5) and never suggest
   running exploratory or destructive agent behavior against real
   project files (`notes.txt`, `.env`). This already happened once.
4. `lessons/NN-<slug>/` are self-contained teaching folders, each with
   its own script, its own copy of any shared helper it needs
   (`executeTool.ts`, `tools.ts`, etc. — copied forward from whichever
   earlier lesson introduced them, e.g. `lessons/02-system-prompt/`),
   its own fixtures, and its own `README.md` write-up. They
   deliberately duplicate these files rather than importing across
   folders — every lesson should still run if you copy just its own
   folder out of this repo. Don't suggest "de-duplicating" this by
   having lessons import from each other.

## Conventions

- Code, comments, error messages, and docs are in English.
- Package manager is pnpm — don't suggest npm or yarn commands/lockfiles.
- Formatting and linting via Biome (`pnpm check`), not ESLint/Prettier.
- New destructive or adversarial tests belong in
  `lessons/NN-<slug>/sandbox/`, never against real project files.

## Lesson requirements

No scaffolding script. Build a new lesson folder by hand, using the
closest existing lesson as your template. Every lesson folder — past
or future, main curriculum or deep-dive track — must contain all of
the following:

1. **Two TypeScript entry points, before and after, named accordingly.**
   Two files, `<name>Before.ts` and `<name>After.ts` (where setup is
   heavily shared between them, factor it into a local helper both
   import — see `lessons/05-context-compaction/tokenEstimation.ts`),
   the first showing the naive/unguarded/unoptimized behavior and the
   second showing the same task after the fix/guard/optimization is
   applied — each runnable independently via its own `pnpm` script,
   always named `lesson:NN-before` / `lesson:NN-after`, so both
   outcomes are directly comparable. Reference implementations:
   `lessons/03-sandbox-incident/` (`sandboxIncidentBefore.ts` vs
   `sandboxIncidentAfter.ts`) and `lessons/05-context-compaction/`
   (`contextWindowManagementBefore.ts`'s `runWithoutCompaction()` vs
   `contextWindowManagementAfter.ts`'s `runWithCompaction()`).
2. **A dedicated `sandbox/` directory inside the lesson's own folder**,
   with committed example/fixture files or a generator script
   (`generateFixtures.ts`) that produces them. Never point at another
   lesson's `sandbox/`, a shared top-level directory, or a real
   project file (`notes.txt`, `.env`) — see `docs/incidents.md`,
   Incidents 1, 2, and 5.
3. **A `README.md`** following `lessons/TEMPLATE/README.md`, with:
   - a **Goal** section — plain description of what the lesson
     investigates and why, motivated by the previous lesson
   - one **Before/After** pair per entry point from (1): Before is
     the hypothesis written *before* running anything, After is the
     real, observed output — never invented numbers
   - a **Conclusions** section (lessons learned) — numbered list
     preferred over prose, carried forward into later lessons
   - a **Next** section if there's a concrete follow-up; delete it
     if there isn't
4. **An incident reference, if applicable.** If running the lesson
   produces real destructive or unsafe behavior (even confined to
   `sandbox/`), log it in `docs/incidents.md` with root cause and fix,
   and link to it from the lesson's `README.md` — same bar as
   Incidents 1-6 there.
5. Wire both new npm scripts into `package.json` and add the lesson's
   row to the table in `README.md`.

There are no git tags involved; the folder itself on `main` *is* the
record — nothing further to tag or checkout. See the Reproducibility
section in `README.md`.
- A completed lesson gets two git tags: `-start` at the commit right
  before its code existed, `-done` at the commit where its code, docs,
  and conclusions were finished. Tag both before moving to the next
  lesson — see the Reproducibility section in `README.md`.

## Deep-dive tracks (separate from the lesson lifecycle above)

`docs/plan/deep-dive-tracks.md` specs out extensions below the Claude
API/SDK level (local inference via Ollama, raw MCP, sandboxing, etc.),
listed in `README.md` under "Planned: deep-dive tracks". These
intentionally do **not** use the `lessons/NN-<slug>/` folder naming —
their code goes under `src/lessons/ollama/` (and `src/lessons/<tool>/`
for the other tracks) and their docs under `docs/lessons/ollama-0N-*.md`,
per the spec. The "Lesson requirements" above still apply in full
(before/after entry points, dedicated `sandbox/`, README structure,
incident references) — only the folder location differs. Don't suggest
folding them into the `lessons/NN-<slug>/` numbering.