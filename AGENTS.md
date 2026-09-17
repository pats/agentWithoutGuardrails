# Agent instructions for this repo

This is a learning project, not production code. It exists to understand
Claude tool-use and agentic loops at a low level — the code intentionally
avoids high-level SDK abstractions in `src/index.ts` and `lessons/`.

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
3. `lessons/NN-<slug>/sandbox/` holds disposable fake files for
   destructive testing, one directory per lesson, physically inside
   that lesson's own folder — never share a sandbox directory across
   lessons (see `docs/incidents.md`, Incident 5) and never suggest
   running exploratory or destructive agent behavior against real
   project files (`notes.txt`, `.env`). This already happened once.
4. `lessons/NN-<slug>/` are self-contained teaching folders, each with
   its own script, its own copy of any shared helper it needs
   (`executeTool.ts`, `tools.ts`, etc.), its own fixtures, and its own
   `README.md` write-up. They deliberately duplicate files from `src/`
   rather than importing across folders — every lesson should still
   run if you copy just its own folder out of this repo. Don't suggest
   "de-duplicating" this by having lessons import from `src/` or from
   each other.

## Conventions

- Code, comments, error messages, and docs are in English.
- Package manager is pnpm — don't suggest npm or yarn commands/lockfiles.
- Formatting and linting via Biome (`pnpm check`), not ESLint/Prettier.
- New destructive or adversarial tests belong in
  `lessons/NN-<slug>/sandbox/`, never against real project files.

## Lesson lifecycle

Every lesson — past or future — follows the same three-stage cycle.
There are no git tags involved; the folder itself on `main` *is* the
record. Use `scripts/new-lesson.sh` to scaffold a new one instead of
doing these steps by hand.

1. **Scaffold.** `./scripts/new-lesson.sh <NN> <slug> "Title"` creates
   `lessons/NN-<slug>/` with a script stub and a `README.md` from
   `lessons/TEMPLATE/README.md`, and wires up `package.json` +
   top-level `README.md`.
2. **Learn.** Write and run the experiment inside that folder — copy
   in whatever shared files it needs (`executeTool.ts`, `tools.ts`,
   etc.) so it stays self-contained. This is exploratory — expect to
   iterate, and expect the first version to reveal something you
   didn't predict (see lesson 05: the first working version of
   compaction produced an infinite loop, not a clean success).
3. **Finish.** Once you understand what actually happens, fix the code
   if it needs fixing — a lesson doesn't have to end in success. An
   honestly documented failure with root-cause analysis is a valid,
   often more valuable, output; log it in `docs/incidents.md` if it's
   a real incident, same as any other. Fill in the folder's
   `README.md`: Goal, Prerequisites, Run, **Before** (hypothesis,
   written before you saw the result), **After** (what actually
   happened, real numbers/output, never invented ones), **Conclusions**,
   and **Next** if there's a follow-up. Commit the finished folder as
   one commit and push.

There's nothing further to tag or checkout: the folder as it sits on
`main` right now is simultaneously the only copy and the permanent
record. See the Reproducibility section in `README.md`.
- A completed lesson gets two git tags: `-start` at the commit right
  before its code existed, `-done` at the commit where its code, docs,
  and conclusions were finished. Tag both before moving to the next
  lesson — see the Reproducibility section in `README.md`.