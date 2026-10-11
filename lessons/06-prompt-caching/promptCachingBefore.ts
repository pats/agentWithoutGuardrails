import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

export const MODEL = 'claude-haiku-4-5-20251001';

export const KNOWLEDGE_BASE_PATH = fileURLToPath(
  new URL('./sandbox/knowledge-base.txt', import.meta.url),
);

export interface CacheCallResult {
  label: string;
  inputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  latencyMs: number;
}

/**
 * With cacheControl: false, no cache_control marker is sent.
 */
export async function callOnce(
  client: Anthropic,
  label: string,
  system: string,
  userMessage: string,
  options: { cacheControl: boolean; tools?: Anthropic.Tool[] },
): Promise<CacheCallResult> {
  const systemBlock: Anthropic.TextBlockParam = { type: 'text', text: system };

  const startedAt = performance.now();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 100,
    system: [systemBlock],
    tools: options.tools,
    messages: [{ role: 'user', content: userMessage }],
  });

  return {
    label,
    inputTokens: response.usage.input_tokens,
    cacheCreationInputTokens: response.usage.cache_creation_input_tokens ?? 0,
    cacheReadInputTokens: response.usage.cache_read_input_tokens ?? 0,
    latencyMs: Math.round(performance.now() - startedAt),
  };
}

async function main() {
  const client = new Anthropic();

  let knowledgeBase: string;
  try {
    knowledgeBase = await readFile(KNOWLEDGE_BASE_PATH, 'utf-8');
  } catch {
    console.error(`Missing ${KNOWLEDGE_BASE_PATH} — run generateFixtures.ts first.`);
    process.exit(1);
  }

  const system = `Answer questions using only this knowledge base.\n\n${knowledgeBase}`;
  const question = 'Who performs the secondary check in reference RB-3-07? One sentence.';
  const options = { cacheControl: false };

  const results: CacheCallResult[] = [];
  for (let i = 1; i <= 3; i++) {
    results.push(await callOnce(client, `no-cache #${i}`, system, question, options));
  }
  console.table(results);
}

main();
