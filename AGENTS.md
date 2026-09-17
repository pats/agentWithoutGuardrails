# Agent instructions for this repo

This is a learning project, not production code. It exists to understand
Claude tool-use and agentic loops at a low level — the code intentionally
avoids high-level SDK abstractions in `src/index.ts` and `src/lessons/`.

## Read-only mode

Agents working in this repo must not write, edit, or delete any file —
including when explicitly asked to by the user in a given turn. This repo
is for code review and discussion only. Propose changes as suggestions in
the conversation (diffs, snippets, explanations); the human applies them
manually. This restriction exists precisely because this project's own
agent-loop code has caused real file damage before (see `docs/incidents.md`).

## Before making suggestions

1. Read `docs/incidents.md` first. It documents real failures this agent
   caused while being built (including deleting a real `.env` file) and
   the fixes applied. Don't suggest reintroducing a pattern already logged
   there.
2. `src/security.ts` and `src/protectedFiles.ts` are independent, layered
   defenses. Don't suggest consolidating them into one check — see the
   incident log for why the separation matters.
3. `sandbox/<NN-lesson-name>/` holds disposable fake files for destructive
   testing, scoped one directory per lesson — never share a sandbox
   directory across lessons (see `docs/incidents.md`, Incident 5) and
   never suggest running exploratory or destructive agent behavior
   against real project files (`notes.txt`, `.env`). This already
   happened once.
4. `src/lessons/` are standalone teaching scripts, each with a matching
   write-up in `docs/lessons/`. They intentionally duplicate some logic
   from `src/` rather than importing it, to stay self-contained and
   readable in isolation.

## Conventions

- Code, comments, error messages, and docs are in English.
- Package manager is pnpm — don't suggest npm or yarn commands/lockfiles.
- Formatting and linting via Biome (`pnpm check`), not ESLint/Prettier.
- New destructive or adversarial tests belong in `sandbox/<NN-lesson-name>/`,
  never against real project files.

## Lesson lifecycle

Every lesson — past or future — follows the same four-stage cycle. The
`-start`/`-done` tags aren't just markers, they're checkpoints around
this specific process. Use `scripts/new-lesson.sh` to scaffold a new
one instead of doing these steps by hand.

1. **Start.** Tag `lesson-NN-<slug>-start` at the current HEAD, before
   writing any lesson-specific code. This is the blank slate — whatever
   the repo already has from prior lessons, nothing more.
2. **Learn.** Write and run the experiment. This is exploratory —
   expect to iterate, and expect the first version to reveal something
   you didn't predict (see lesson 05: the first working version of
   compaction produced an infinite loop, not a clean success).
3. **Fix / finalize.** Once you understand what actually happens, fix
   the code if it needs fixing — a lesson doesn't have to end in
   success. An honestly documented failure with root-cause analysis is
   a valid, often more valuable, output; log it in `docs/incidents.md`
   if it's a real incident, same as any other. Write
   `docs/lessons/NN-<slug>.md` from `docs/lessons/TEMPLATE.md`: Goal,
   Prerequisites, Run, **Before** (hypothesis, written before you saw
   the result), **After** (what actually happened, real numbers/output,
   never invented ones), **Conclusions**, and **Next** if there's a
   follow-up.
4. **Done.** Commit the finished code + docs together, then tag
   `lesson-NN-<slug>-done` at that commit. Push the commit and both
   tags before starting the next lesson.

Checking out `-start` reproduces the exact blank slate; checking out
`-done` reproduces the exact finished result — see the Reproducibility
section in `README.md`.