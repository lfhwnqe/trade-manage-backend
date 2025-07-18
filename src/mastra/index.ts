import { Mastra } from '@mastra/core/mastra';
import { kimiAgent } from './agents/kimi-agent';
import { greetWorkflow } from './workflows/greet.workflow';

export const mastra = new Mastra({
  agents: { 'kimi-agent': kimiAgent },
  workflows: { greet: greetWorkflow },
});
