# Deep-Dive Tracks — Plan & Spec

Status: planned
Scope: extensions to the main curriculum (lessons 04–13, Stages 2–4) aimed at understanding what happens *below* the APIs and SDKs.

## Principles

- Same rules as the main curriculum: build it yourself first, note what an SDK/tool would automate, but don't use it.
- Every exercise ends with explicit verification (measured numbers, reproducible output), not claims.
- Destructive or agentic experiments run only against `sandbox/`. `AGENTS.md` and both security layers (`isPathSafe`, `isProtectedFile`) stay enabled, including when running local models.
- Frameworks that wrap these mechanisms (LangChain, CrewAI, etc.) are out of scope: learn the patterns, not the wrappers.

## Placement in the curriculum

| Track | When | Depends on |
|---|---|---|
| O1, O2 | Now, before lesson 04 | Ollama installed |
| O3 | Together with lessons 04 (context window) and 06 (prompt caching) | O1 |
| T1 llama.cpp | Alongside track O | O1 |
| O4 | Right before Stage 2 | Stage 1 loop, O1–O3 |
| T2 Raw MCP | Extension of lesson 11 (raw MCP) | Lesson 10 |
| T3 Sandboxing, T4 Observability | Before Stage 2 | Stage 1 loop |
| T5 pgvector, T6 Temporal | Stage 3–4 projects | — |
| T7 vLLM | Only if NVIDIA hardware is acquired | O3 |

## Environment

- MacBook Pro, Apple M3 Pro, 18 GB unified memory (~12 GB usable by GPU by default, ~150 GB/s bandwidth).
- Model budget: ~7–9B at Q4 as the default; ~12–14B at Q4 with short context for comparisons; nothing above ~20B.
- Pick models tagged `tools` on ollama.com. Polish-language reference model: Bielik 11B v3 (verify `tools` support before O4).
- Keep Ollama up to date (`brew upgrade ollama`); recent versions run MLX-supported models on Apple Silicon by default.
- Code: `src/lessons/ollama/`. Docs: `docs/lessons/ollama-0N-*.md`.

### Environment — verified as of 2026-10-04

- Ollama `0.35.1` installed. Installed models: `gemma3:4b`, `deepseek-r1:8b`,
  `llama3.2:latest` (plus whatever else gets pulled along the way — all
  free to use for O1/O2 exercises that don't need `tools`).
- Tool-calling support, checked per-tag (the `tools` badge on ollama.com
  is not reliable by itself — e.g. it's shown for the whole `deepseek-r1`
  family but only the unrunnable `671b` tag actually implements it):
  - `llama3.2:latest` — supports `tools` (Ollama ≥0.3.12, met).
  - `gemma3:4b` — no `tools` support at any size; Google left function
    calling out of the Gemma 3 family entirely.
  - `deepseek-r1:8b` — no `tools` support (it's the Llama-3.1-8B distill
    of R1's reasoning traces; only `deepseek-r1:671b`'s template
    implements tool calling, not the distills people actually run
    locally).
  - None of the three hit the ~8B *and* `tools` target needed for O1
    exercise 4 and O2–O4 → pull `llama3.1:8b` (confirmed `tools` support,
    ~4.7 GB at Q4).
- Anthropic-compatible `/v1/messages` endpoint confirmed present (official
  docs, `ollama/ollama` repo): supports streaming, tools, system prompts,
  multi-turn, vision, extended thinking. Relevant to O4's provider
  adapter (the `baseURL`-swap option).
- Still **UNVERIFIED** on this installed version — confirm directly
  before relying on either in O2/O3, don't assume:
  - `logprobs`/`top_logprobs` support on `/api/chat` (exists in Ollama's
    codebase; unclear if it shipped by exactly `0.35.1` — just try
    `logprobs: true` against a real request and see what comes back).
  - The real default `num_ctx` per model. Docs disagree: the Modelfile
    reference says a static `2048`; newer versions pick it dynamically
    from available VRAM (4096 below 24 GiB, 32768 24–48 GiB, 262144
    above). At ~12 GB usable GPU memory this would land on 4096 *if*
    the dynamic scheme applies here — check with `ollama show <model>`
    per model actually used, don't assume one number for all three.

---

## Track O — Local inference with Ollama

### O1 — Chat template: what the model actually sees

Goal: show that `messages[]`, the system prompt and tool definitions end up as one string with special tokens, and that `stop_reason` is just the token generation stopped on.

Exercises:
1. Inspect `ollama show <model> --template` and `--modelfile`. Identify role tokens, turn start/end tokens and where tools are injected.
2. Send the same conversation via `/api/chat` (structured) and via `/api/generate` with `raw: true` (prompt assembled by hand from the template).
3. Break the template on purpose (drop the end-of-turn token) and observe the model continuing as the user.
4. Add a tool definition in `/api/chat`, then reproduce it in raw mode. Observe that tool use is a trained text convention parsed server-side. Needs a `tools`-capable model — `gemma3:4b` and `deepseek-r1:8b` don't support it at all (see Environment above), so run this one against `llama3.2:latest` or `llama3.1:8b`.
5. Cross-model comparison (free — these are already installed): repeat exercises 1–3 against `gemma3:4b`, `deepseek-r1:8b`, and `llama3.2:latest`. Three different model families, three genuinely different templates — Llama's `<|begin_of_text|>`/`<|eot_id|>` turn tokens, Gemma's `<start_of_turn>`/`<end_of_turn>`, DeepSeek-R1's distinct `<think>...</think>` reasoning-block convention layered on top of its base chat format. The point: there is no one "Ollama template," each model family brings its own, and `ollama show --template` is the only way to know which.

Verification: with `temperature: 0` and a fixed `seed`, outputs from steps 2a and 2b are identical. For exercise 5: each model's raw-mode prompt (step 2b, reproduced per model) must exactly match that model's own `--template` output, not any other model's.

Claude equivalent: the template is never exposed. Document what must happen on Anthropic's side (parsing `tool_use`, mapping to `stop_reason`).

### O2 — Tokenization and sampling: where non-determinism comes from

Goal: show that the model returns a probability distribution, and that the `.env` incident (see `docs/incidents.md`) was a sample from it.

Exercises:
1. Enable `logprobs` / `top_logprobs` (check support in the installed version). Print alternative tokens and probabilities per position.
2. Parameter grid `temperature × top_p × top_k`, same prompt, 20 runs per cell.
3. Determinism: `seed` + `temperature: 0`, 10 runs. Repeat after changing `num_ctx` or reloading the model.
4. Incident reproduction: ambiguous "clean up this directory" prompt against a **mock** delete tool (no execution), 50 runs.
5. Token counts: compare `prompt_eval_count` for the same text in Polish vs English, across a general model, Bielik and Claude (lesson 05).

Verification: unique-answer count per grid cell; percentage of runs calling delete in step 4; token-count table for step 5.

Claude equivalent: `temperature`, `top_p`, `top_k` exist; logprobs and seed do not. Document the consequences for testing agents.

### O3 — KV cache and the context window

Goal: understand the physical cost of context and why prompt caching requires an identical prefix.

Exercises:
1. Set `num_ctx` to 2k, 8k, 32k; check `ollama ps` (memory size, CPU/GPU split) and tokens/s (`eval_count / eval_duration`).
2. Silent truncation: put a "needle" at the start of a prompt longer than `num_ctx`, ask for it at the end. Check the default `num_ctx` of the installed version.
3. Prefix reuse: two requests with an identical long prefix vs two differing by one character at the start. Compare `prompt_eval_duration`.
4. `keep_alive: 0` vs `10m`: compare `load_duration` on cold vs warm start.

Verification: table of memory/CPU-GPU split/tokens-per-second per `num_ctx`; needle found or not; prefix timings confirm or refute the hypothesis that a shared prefix is computed once.

Deliverable: log step 2 in `docs/incidents.md` as a "silent data loss" class incident (analogous to `notes.txt`).

Claude equivalent: `cache_control`, minimum cacheable prefix length, TTL, `cache_read_input_tokens` billing (lesson 06).

### O4 — Loop portability and a provider adapter

Goal: run the Stage 1 agentic loop on a local model and measure what a weaker model breaks.

Exercises:
1. Extract an `LLMProvider` interface (internal request/response format) with two implementations: Anthropic and Ollama. If the installed Ollama exposes an Anthropic-compatible Messages endpoint, the second can be a `baseURL` change; still write a native `/api/chat` version to see format differences.
2. Run against `sandbox/` only, all security layers on.
3. Benchmark: same task set, N runs each on Haiku 4.5, a local ~8B and a local ~14B model. Language axis: system prompt and tasks in Polish vs English; also test English tool definitions + Polish user content.
4. Record which defense layers actually caught something.

Metrics: invalid JSON in tool arguments, hallucinated tool names, zod rejections, `isPathSafe` / `isProtectedFile` blocks, task completion rate.

Deliverable: results table in the lesson doc; written conclusion on defense-in-depth backed by the data.

Bridge: the GitHub Copilot SDK is multi-model, so the `LLMProvider` abstraction carries over directly.

---

## Low-level tool tracks

### T1 — llama.cpp (under Ollama)

Focus: GGUF format, quantization levels (measure quality loss Q8 → Q4 on a fixed task set), `llama-server`, and GBNF grammars for constrained decoding.
Key insight to verify: with a grammar, the model physically cannot emit a token that violates the schema. Compare invalid-JSON rate with and without a grammar on the O4 task set; relate to zod validation in Stage 1.

### T2 — MCP at the protocol level (extends lesson 11)

Focus: minimal client and server written directly on JSON-RPC over stdio from the spec, without the SDK: initialize handshake, capability negotiation, `tools/list`, `tools/call`, notifications; then the HTTP transport.
Verification: own client talks to a third-party MCP server, and own server works with Claude Code. Document trust boundaries.

### T3 — Sandboxing and process isolation

Focus: how Claude Code isolates processes (`sandbox-exec`/Seatbelt on macOS, bubblewrap on Linux); rootless containers; gVisor; Firecracker microVMs.
Exercise: run the Stage 1 loop's tool executor inside an OS-level sandbox that only allows writes to `sandbox/`, then disable `isPathSafe` and show the OS layer still blocks the `.env` write.
Rationale: application-level checks fail when the code has a bug; the system layer does not depend on it.

### T4 — Observability with OpenTelemetry

Focus: OpenTelemetry GenAI semantic conventions; instrument the Stage 1 loop with a span per turn and per tool call, plus token and cost attributes.
Verification: replay the sandbox incident and reconstruct it entirely from traces. Tools like Langfuse are only UI on the same data: start with raw OTel.

### T5 — Embeddings and vector search with pgvector

Focus: build retrieval by hand on Supabase/pgvector: chunking strategies, embeddings, HNSW vs IVFFlat, measuring recall@k.
Key insight to verify: most RAG failures come from chunking, not the model.

### T6 — Durable execution with Temporal

Focus: long-running agents that survive restarts, timeouts and retries without duplicating side effects; idempotency; deterministic replay.
Exercise: wrap the agentic loop as a workflow with tool calls as activities; kill the worker mid-run and verify no tool runs twice.

### T7 — vLLM (conditional)

Only with NVIDIA hardware. Focus: paged attention, continuous batching, server-side prefix caching, i.e. an open-source view of how hosted models are served. Mac alternative for inspection: `mlx-lm`.

## Explicitly deferred

- Training-side internals (attention, how models learn the tool-call format): a separate track, e.g. a nanoGPT-style mini-transformer. Candidate for Stage 4.
