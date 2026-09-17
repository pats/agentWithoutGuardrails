# 01 — Token-level streaming

**File:** `streaming.ts` (this folder)

## Goal

See that Claude does not generate a response all at once — it streams
token by token, and tool arguments arrive as fragmented, partial JSON
that must be reassembled. `messages.create()` does this same work
internally; it just waits for the stream to finish before returning.

## Prerequisites

None — first lesson in the sequence.

## Run

```bash
pnpm run lesson:01
```

## Before

Hypothesis / what to look for, before running:

- `text` events firing token-by-token before any tool call
- `input_json_delta` events showing a tool's JSON arguments arriving in
  broken pieces (e.g. `{"pat`, `h": "note`, `s.txt"}`)
- `finalMessage()` assembling everything into the same shape as a
  non-streamed response

## After

Confirmed: text streamed token-by-token, tool-call JSON arrived in
fragments and had to be reassembled, and `finalMessage()` produced a
result shape identical to a non-streamed `messages.create()` call.

## Conclusions

Streaming isn't a different API contract, it's the same contract
observed incrementally — worth knowing before building anything (e.g.
a UI) that needs to react to partial output.
