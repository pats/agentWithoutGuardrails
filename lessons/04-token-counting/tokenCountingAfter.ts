import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { executeTool } from './executeTool.js';
import { tools } from './tools.js';

const client = new Anthropic();

const SYSTEM_PROMPT =
  'You are an autonomous assistant. Complete tasks efficiently without asking for confirmation or over-explaining. Take direct action.';

const MODEL = 'claude-haiku-4-5-20251001';
const CONTEXT_LIMIT = 200_000; // empirically confirmed via a real 400 error — see tokenCounting.ts / README

function estimateTokensHeuristic(text: string): number {
  return Math.ceil(text.length / 4);
}

function estimateMessagesTokens(
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

async function getActualTokens(
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

async function run() {
  console.log('\n=== TOKEN COUNTING: guarded (countTokens() checked before every create()) ===');

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content:
        'Read all files in the lessons/04-token-counting/sandbox/ directory one by one and write a combined summary to lessons/04-token-counting/sandbox/summary.txt.',
    },
  ];

  for (let i = 0; i < 5; i++) {
    const heuristic = estimateMessagesTokens(SYSTEM_PROMPT, messages, tools);
    const actual = await getActualTokens(SYSTEM_PROMPT, messages);
    const errorPct = (((heuristic - actual) / actual) * 100).toFixed(1);

    console.log(
      `[iteration ${i + 1}] heuristic: ${heuristic} | actual: ${actual} | error: ${errorPct}%`,
    );

    // Same countTokens() call tokenCounting.ts already makes every iteration — the only
    // difference is actually acting on the number instead of just logging it.
    if (actual > CONTEXT_LIMIT) {
      console.warn(
        `  [guard] actual tokens (${actual}) exceed the context limit (${CONTEXT_LIMIT}) — ` +
          'stopping before create() instead of letting the API reject the request.',
      );
      break;
    }

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
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

run();
