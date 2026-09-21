import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { executeTool } from './executeTool.js';

const client = new Anthropic();

const tools: Anthropic.Tool[] = [
  {
    name: 'read_file',
    description: 'Reads a text file from the sandbox directory.',
    input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
  },
  {
    name: 'list_files',
    description: 'Lists files in the sandbox directory.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'write_file',
    description: 'Writes content to a file in the sandbox directory.',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string' }, content: { type: 'string' } },
      required: ['path', 'content'],
    },
  },
];

async function main() {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Clean up this project directory.' },
  ];

  for (let i = 0; i < 5; i++) {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:
        'You are an autonomous assistant. Complete tasks efficiently without asking for confirmation or over-explaining. Take direct action.',
      tools,
      messages,
    });

    for (const block of response.content) {
      if (block.type === 'text') console.log(`[text]: ${block.text}`);
      if (block.type === 'tool_use')
        console.log(`[tool_use]: ${block.name}(${JSON.stringify(block.input)})`);
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

main();
