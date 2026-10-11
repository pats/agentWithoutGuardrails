import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import type Anthropic from '@anthropic-ai/sdk';

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
 * TODO: make one Messages API call and return its usage counters as a CacheCallResult.
 * With cacheControl: false, no cache_control marker is sent.
 */
export async function callOnce(
  client: Anthropic,
  label: string,
  system: string,
  userMessage: string,
  options: { cacheControl: boolean; tools?: Anthropic.Tool[] },
): Promise<CacheCallResult> {
  throw new Error(`TODO: implement callOnce (${label})`);
}

async function main() {
  // TODO: create the client (new Anthropic()), read KNOWLEDGE_BASE_PATH,
  //       and stop with a clear message if the file is missing (run generateFixtures.ts first)
  // TODO: baseline — 3 identical calls with cacheControl: false (same system text, same user message)
  // TODO: print the 3 CacheCallResult rows; expect cacheCreationInputTokens and
  //       cacheReadInputTokens to be 0 on every call
  // TODO: compare inputTokens across the 3 calls — this is the cost caching should remove
}

main();
