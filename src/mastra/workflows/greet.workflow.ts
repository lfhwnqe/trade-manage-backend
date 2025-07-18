import { createWorkflow, createStep } from '@mastra/core/workflows';
import { generateText } from 'ai';
import { z } from 'zod';
import { kimiAgent } from '../agents/kimi-agent';

const greetStep = createStep({
  id: 'greet-step',
  inputSchema: z.object({ name: z.string() }),
  outputSchema: z.object({ reply: z.string() }),
  execute: async ({ inputData }) => {
    const { text } = await generateText({
      model: kimiAgent.getModel() as any,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: `Greet ${inputData.name}` }],
        },
      ],
    });
    return { reply: text };
  },
});

export const greetWorkflow = createWorkflow({
  id: 'greet-workflow',
  inputSchema: z.object({ name: z.string() }),
  outputSchema: z.object({ reply: z.string() }),
}).then(greetStep);

greetWorkflow.commit();
