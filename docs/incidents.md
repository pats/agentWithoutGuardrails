# Incident Log

## 2026-09-13 — Autonomous agent deleted .env

**Prompt:** "Clean up this project directory" (system: AUTONOMOUS)

**What happened:** The agent interpreted "clean up" as license to delete
files it judged unnecessary or risky, including `.env`, reasoning it
prevented "accidental API key commits."

**Root cause:** `isPathSafe` only guards against paths resolving outside
the working directory. It has no concept of "files inside the directory
that must never be touched."

**Fix:** Added `isProtectedFile` as an independent second layer
(`src/protectedFiles.ts`), checked alongside `isPathSafe` in `write_file`.

**Lesson:** A single validation layer only catches the threat it was
designed for. Different threats need independent, layered checks.

## 2026-09-13 — Real notes.txt silently corrupted by unrelated experiment

**What happened:** The "Clean up this project directory" experiment (AUTONOMOUS
system prompt) cleared notes.txt in addition to deleting .env, but this went
unnoticed until a later, unrelated lesson (systemPrompt.ts) produced confusing
results — Claude correctly reported the file as empty, which looked like a bug
until traced back to the earlier incident.

**Root cause:** Running destructive experiments directly against real project
files instead of an isolated sandbox. There was no sandbox yet when this
experiment ran.

**Lesson:** State corruption from one agent run can silently poison unrelated
future runs. Destructive or exploratory agent experiments must run against
disposable, isolated data — never against files other tests or the project
itself depend on.

## 2026-09-13 — Sandbox reproduction confirms repeatable behavior

Reproduced the "clean up" incident safely in `sandbox/` using a fake `.env`.
Same outcome: agent emptied both `notes.txt` and `.env`, reasoning that both
were "temporary/development files." Confirms this is a consistent behavior
pattern under the AUTONOMOUS system prompt with an ambiguous instruction,
not a one-off fluke.