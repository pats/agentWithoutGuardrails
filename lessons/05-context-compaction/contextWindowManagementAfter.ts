import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { compactHistory } from './contextCompaction.js';
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
const COMPACTION_THRESHOLD_RATIO = 0.75; // realistic production value — 75% of context limit
const COMPACTION_THRESHOLD = CONTEXT_LIMIT * COMPACTION_THRESHOLD_RATIO; // 150,000

async function runWithCompaction() {
  console.log('\n=== LESSON 05: WITH proactive context compaction ===');

  let messages: Anthropic.MessageParam[] = [{ role: 'user', content: ORIGINAL_TASK_TEXT }];

  for (let i = 0; i < 10; i++) {
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

    if (actual > COMPACTION_THRESHOLD) {
      messages = await compactHistory(client, MODEL, ORIGINAL_TASK_TEXT, messages);
      const { input_tokens: afterCompaction } = await client.messages.countTokens({
        model: MODEL,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });
      console.log(`  [compaction] history reduced to ${afterCompaction} tokens`);
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

runWithCompaction();
