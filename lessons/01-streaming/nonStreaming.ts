import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { tools } from './tools.js';

const client = new Anthropic();

async function main() {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    tools,
    messages: [
      {
        role: 'user',
        content:
          "First say one sentence about what you're about to do, then read the file at path lessons/01-streaming/sandbox/notes.txt.",
      },
    ],
  });

  console.log('--- message (returned only after full generation) ---');
  console.log(JSON.stringify(message.content, null, 2));
}

main();
