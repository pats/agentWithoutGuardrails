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
 * With cacheControl: true, cache_control goes on the system block. tools is only for the invalidation test.
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
  // TODO: create the client (new Anthropic()) and read KNOWLEDGE_BASE_PATH
  // TODO: 3 identical calls with cacheControl: true — expect call 1 to write the cache,
  //       and calls 2 and 3 to read it
  // TODO: invalidation test — change 1 byte of the cached knowledge base text (in memory,
  //       not on disk), call again: expect a cache write, not a read
  // TODO: invalidation test — restore the original text, then add a tool definition:
  //       tools render before system, so expect the whole cached prefix to rebuild
  // TODO: print all CacheCallResult rows as one table
}

main();
