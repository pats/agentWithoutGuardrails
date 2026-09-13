# Lesson 1 — Token-level streaming

**File:** `src/lessons/streaming.ts`

**Run:** `pnpm exec tsx src/lessons/streaming.ts`

## What this shows

Claude does not generate a response all at once — it streams token by
token, and tool arguments arrive as fragmented, partial JSON that must be
reassembled. `messages.create()` does this same work internally; it just
waits for the stream to finish before returning.

## What to look for

- `text` events firing token-by-token before any tool call
- `input_json_delta` events showing a tool's JSON arguments arriving in
  broken pieces (e.g. `{"pat`, `h": "note`, `s.txt"}`)
- `finalMessage()` assembling everything into the same shape as a
  non-streamed response