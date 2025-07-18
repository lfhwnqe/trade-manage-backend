// Test script to verify the workflow works
const { mastra } = require('./src/mastra/index.ts');

async function testWorkflow() {
  try {
    console.log('Testing greet workflow...');

    // Test the workflow directly
    const result = await mastra.workflows.greet.execute({ name: 'World' });

    console.log('Workflow result:', result);
  } catch (error) {
    console.error('Error executing workflow:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testWorkflow();
