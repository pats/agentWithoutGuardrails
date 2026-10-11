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
 * With cacheControl: true, cache_control goes on the system block. tools is only for the invalidation test.
 */
export async function callOnce(
  client: Anthropic,
  label: string,
  system: string,
  userMessage: string,
  options: { cacheControl: boolean; tools?: Anthropic.Tool[] },
): Promise<CacheCallResult> {
  const systemBlock: Anthropic.TextBlockParam = { type: 'text', text: system };
  if (options.cacheControl) systemBlock.cache_control = { type: 'ephemeral' };

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
  const knowledgeBase = await readFile(KNOWLEDGE_BASE_PATH, 'utf-8');

  const system = `Answer questions using only this knowledge base.\n\n${knowledgeBase}`;
  const question = 'Who performs the secondary check in reference RB-3-07? One sentence.';
  const cached = { cacheControl: true };

  const results: CacheCallResult[] = [];
  for (let i = 1; i <= 3; i++) {
    // variant 1: one character changed at the very END of the cached text
    const changed = `${system.slice(0, -1)}!`;
    results.push(await callOnce(client, 'last char changed', changed, question, cached));

    // variant 2: original text again
    results.push(await callOnce(client, 'original again', system, question, cached));

    // variant 3: same text, but a tool definition added
    const tools: Anthropic.Tool[] = [
      {
        name: 'noop',
        description: 'Does nothing.',
        input_schema: { type: 'object', properties: {} },
      },
    ];
    results.push(await callOnce(client, 'tool added', system, question, { ...cached, tools }));

    // Variant 4: original text, no tools, no cache_control in the request
    const uncached = { cacheControl: false };
    results.push(await callOnce(client, 'no cache_control', system, question, uncached));
  }
  console.table(results);
}

main();
