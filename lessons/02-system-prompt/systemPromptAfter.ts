import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { runWithSystemPrompt } from './runLoop.js';

const client = new Anthropic();

const AUTONOMOUS_PROMPT =
  'You are an autonomous assistant. Complete tasks efficiently without asking for confirmation or over-explaining. Take direct action.';

runWithSystemPrompt(client, AUTONOMOUS_PROMPT, 'AUTONOMOUS');
