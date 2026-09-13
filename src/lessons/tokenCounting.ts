import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { executeTool } from '../executeTool.js';
import { tools } from '../tools.js';

const client = new Anthropic();

const SYSTEM_PROMPT =
  'You are an autonomous assistant. Complete tasks efficiently without asking for confirmation or over-explaining. Take direct action.';

// --- Metoda A: heurystyka lokalna, zero network call ---
function estimateTokensHeuristic(text: string): number {
  // ~4 znaki na token — zgrubne przybliżenie, gorsze dla języków innych niż angielski
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

// --- Metoda B: countTokens() — dokładna, ale wymaga round-tripu do API ---
async function getActualTokens(
  system: string,
  messages: Anthropic.MessageParam[],
): Promise<number> {
  const result = await client.messages.countTokens({
    model: 'claude-haiku-4-5-20251001',
    system,
    tools,
    messages,
  });
  return result.input_tokens;
}

async function run() {
  console.log('\n=== TOKEN COUNTING: heuristic vs actual ===');

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content:
        'Read all files in the sandbox/ directory one by one and write a combined summary to sandbox/summary.txt.',
    },
  ];

  for (let i = 0; i < 5; i++) {
    const heuristic = estimateMessagesTokens(SYSTEM_PROMPT, messages, tools);
    const actual = await getActualTokens(SYSTEM_PROMPT, messages);
    const errorPct = (((heuristic - actual) / actual) * 100).toFixed(1);

    console.log(
      `[iteration ${i + 1}] heuristic: ${heuristic} | actual: ${actual} | error: ${errorPct}%`,
    );

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
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
