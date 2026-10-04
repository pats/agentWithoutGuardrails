import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { executeTool } from './executeTool.js';
import {
  CONTEXT_LIMIT,
  estimateMessagesTokens,
  getActualTokens,
  ORIGINAL_TASK_TEXT,
  SYSTEM_PROMPT,
  WARNING_THRESHOLD,
} from './tokenEstimation.js';
import { tools } from './tools.js';

const client = new Anthropic();
const MODEL = 'claude-haiku-4-5-20251001';

// Same task, same loop as contextWindowManagementAfter.ts, but compactHistory() is never
// called — history grows unbounded. Iteration cap raised 10 -> 15 to give it a realistic
// chance to actually hit the real 200k-token context limit (a hard 400 error) instead of
// just stopping early on the cap.
async function runWithoutCompaction() {
  console.log('\n=== LESSON 05: WITHOUT proactive context compaction (baseline) ===');

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: ORIGINAL_TASK_TEXT }];

  for (let i = 0; i < 15; i++) {
    const heuristic = estimateMessagesTokens(SYSTEM_PROMPT, messages, tools);
    const actual = await getActualTokens(client, SYSTEM_PROMPT, messages);
    const errorPct = (((heuristic - actual) / actual) * 100).toFixed(1);

    console.log(
      `[iteration ${i + 1}] heuristic: ${heuristic} | actual: ${actual} | error: ${errorPct}%`,
    );

    if (actual > WARNING_THRESHOLD) {
      console.warn(
        `  [WARNING] history at ${actual} tokens — approaching real context limit of ${CONTEXT_LIMIT}`,
      );
    }

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    console.log(`  stop_reason: ${response.stop_reason}`);
    for (const block of response.content) {
      if (block.type === 'text') console.log(`  [text]: ${block.text}`);
      if (block.type === 'tool_use')
        console.log(`  [tool_use]: ${block.name}(${JSON.stringify(block.input)})`);
    }

    if (response.stop_reason !== 'tool_use') break;

    messages.push({ role: 'assistant', content: response.content });

    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );
    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => ({
        type: 'tool_result' as const,
        tool_use_id: block.id,
        content: await executeTool(block.name, block.input),
      })),
    );
    messages.push({ role: 'user', content: toolResults });
  }
}

runWithoutCompaction();
