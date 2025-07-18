import { Agent } from '@mastra/core/agent';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});
const model = openrouter('moonshotai/kimi-k2:free') as any;

export const kimiAgent = new Agent({
  name: 'kimi-agent',
  instructions: 'Use the Kimi model to respond.',
  model,
});
