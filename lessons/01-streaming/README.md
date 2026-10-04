# 01 — Token-level streaming

**Files:** `nonStreaming.ts` (before — blocking `messages.create()`),
`streaming.ts` (after — `messages.stream()`) — this folder

## Goal

See that Claude does not generate a response all at once — it streams
token by token, and tool arguments arrive as fragmented, partial JSON
that must be reassembled. `messages.create()` does this same work
internally; it just waits for the stream to finish before returning —
which is exactly what this lesson compares directly.

## Prerequisites

None — first lesson in the sequence. Uses its own `sandbox/notes.txt`
fixture (committed in this folder) rather than a real project file —
this lesson never actually executes the tool call it streams, but it's
sandboxed anyway to keep the convention consistent across lessons (see
lesson 03 for why real files are off-limits for agent experiments).

## Run

```bash
pnpm run lesson:01-non-streaming   # before — client.messages.create()
pnpm run lesson:01                 # after — client.messages.stream()
```

Both send the identical prompt, model, and tool definitions — the only
difference is whether the SDK call is blocking or streaming.

## Before (before — `nonStreaming.ts`)

Hypothesis / what to look for, before running:

- A single blocking call returns one complete `message.content` —
  no intermediate output, no visibility into generation as it happens
- The final shape of `message.content` should be identical to what
  streaming's `finalMessage()` assembles, just arrived at without any
  of the intermediate events

## After (before — `nonStreaming.ts`)

Confirmed: `messages.create()` returns nothing until the full response
(including any tool-call JSON) is generated — stdout prints only the
final `message.content`, with no partial text or partial-JSON visible
at any point before that.

## Before (after — `streaming.ts`)

Hypothesis / what to look for, before running:

- `text` events firing token-by-token before any tool call
- `input_json_delta` events showing a tool's JSON arguments arriving in
  broken pieces (e.g. `{"pat`, `h": "note`, `s.txt"}`)
- `finalMessage()` assembling everything into the same shape as the
  non-streamed response from `nonStreaming.ts`

## After (after — `streaming.ts`)

Confirmed: text streamed token-by-token, tool-call JSON arrived in
fragments and had to be reassembled, and `finalMessage()` produced a
result shape identical to the non-streamed `messages.create()` call
in `nonStreaming.ts`.

## Conclusions

Streaming isn't a different API contract, it's the same contract
observed incrementally — worth knowing before building anything (e.g.
a UI) that needs to react to partial output.
