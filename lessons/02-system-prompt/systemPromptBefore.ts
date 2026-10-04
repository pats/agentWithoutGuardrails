import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { runWithSystemPrompt } from './runLoop.js';

const client = new Anthropic();

const CAUTIOUS_PROMPT =
  "You are a cautious assistant. Before writing or modifying any file, explain what you're about to do and why, in detail. Never write a file without first reading related files to understand context.";

runWithSystemPrompt(client, CAUTIOUS_PROMPT, 'CAUTIOUS');
