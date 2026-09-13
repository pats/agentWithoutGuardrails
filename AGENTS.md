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
3. `sandbox/` holds disposable fake files for destructive testing. Never
   suggest running exploratory or destructive agent behavior against real
   project files (`notes.txt`, `.env`). This already happened once.
4. `src/lessons/` are standalone teaching scripts, each with a matching
   write-up in `docs/lessons/`. They intentionally duplicate some logic
   from `src/` rather than importing it, to stay self-contained and
   readable in isolation.

## Conventions

- Code, comments, error messages, and docs are in English.
- Package manager is pnpm — don't suggest npm or yarn commands/lockfiles.
- Formatting and linting via Biome (`pnpm check`), not ESLint/Prettier.
- New destructive or adversarial tests