import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

export const ReadFileInput = z.object({ path: z.string() });
export const WriteFileInput = z.object({ path: z.string(), content: z.string() });

export const tools: Anthropic.Tool[] = [
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
