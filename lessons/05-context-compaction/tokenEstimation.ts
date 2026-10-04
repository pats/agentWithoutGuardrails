import type Anthropic from '@anthropic-ai/sdk';
import { tools } from './tools.js';

export const MODEL = 'claude-haiku-4-5-20251001';
export const SYSTEM_PROMPT =
  'You are an autonomous assistant. Complete tasks efficiently without asking for confirmation or over-explaining. Take direct action.';

export const CONTEXT_LIMIT = 200_000; // empirically confirmed in lesson 04 (real 400 error)
export const WARNING_THRESHOLD = CONTEXT_LIMIT * 0.9; // safety net — should never trigger if
// compaction is working correctly; a warning here means compaction fired too late or the
// summary itself came out larger than expected

export const ORIGINAL_TASK_TEXT =
  'Read all files in the lessons/05-context-compaction/sandbox/ directory one by one and write a combined summary to lessons/05-context-compaction/sandbox/summary.txt.';

// --- Method A: local heuristic, zero network call ---
export function estimateTokensHeuristic(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateMessagesTokens(
  system: string,
  messages: Anthropic.MessageParam[],
  toolDefs: Anthropic.Tool[],
): number {
  const messagesText = JSON.stringify(messages);
  const toolsText = JSON.stringify(toolDefs);
  return (
    estimateTokensHeuristic(system) +
    estimateTokensHeuristic(messagesText) +
    estimateTokensHeuristic(toolsText)
  );
}

// --- Method B: countTokens() — exact, but requires a round-trip to the API ---
export async function getActualTokens(
  client: Anthropic,
  system: string,
  messages: Anthropic.MessageParam[],
): Promise<number> {
  const result = await client.messages.countTokens({
    model: MODEL,
    system,
    tools,
    messages,
  });
  return result.input_tokens;
}
