import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { tools } from '../tools.js';

const client = new Anthropic();

async function main() {
  const stream = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    tools,
    messages: [
      {
        role: 'user',
        content:
          "First say one sentence about what you're about to do, then read the file at path notes.txt.",
      },
    ],
  });

  stream.on('text', (textDelta) => {
    process.stdout.write(textDelta); // streamed token by token, live
  });

  stream.on('contentBlock', (block) => {
    console.log('\n[contentBlock complete]:', JSON.stringify(block));
  });

  stream.on('streamEvent', (event) => {
    if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta') {
      console.log('[raw JSON fragment for tool_use]:', event.delta.partial_json);
    }
  });

  const finalMessage = await stream.finalMessage();
  console.log('\n\n--- finalMessage (assembled) ---');
  console.log(JSON.stringify(finalMessage.content, null, 2));
}

main();
