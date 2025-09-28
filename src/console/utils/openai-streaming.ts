import { OpenAI } from 'openai';
import chalk from 'chalk';
import { animatedIndicator } from './animated-indicator';

export class OpenAIStreaming {
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }

      this.client = new OpenAI({
        apiKey: apiKey
      });
    }
    return this.client;
  }

  async streamResponse(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      enableWebSearch?: boolean;
      allowedDomains?: string[];
      agentType?: string;
    } = {}
  ): Promise<string> {
    const {
      model = 'gpt-5',
      temperature = 0.7,
      maxTokens = 1500,
      enableWebSearch = false,
      allowedDomains = [],
      agentType = 'scout'
    } = options;

    try {
      const client = this.getClient();

      // Start appropriate animated indicator based on agent and search capability
      if (enableWebSearch) {
        if (agentType === 'mentor') {
          animatedIndicator.start('mentorsearch');
        } else if (agentType === 'analyst') {
          animatedIndicator.start('analystsearch');
        } else if (agentType === 'scoring') {
          animatedIndicator.start('scoringsearch');
        } else {
          animatedIndicator.start('websearch');
        }
      } else {
        animatedIndicator.start('thinking');
      }

      // Convert messages to OpenAI Responses API format
      const input = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Prepare tools for web search if enabled
      const tools = enableWebSearch ? [{
        type: "web_search" as const,
        ...(allowedDomains.length > 0 && {
          filters: {
            allowed_domains: allowedDomains
          }
        })
      }] : undefined;

      // Create streaming response using Responses API
      const stream = await client.responses.create({
        model,
        input,
        stream: true,
        ...(tools && { tools })
      });

      let fullResponse = '';
      let hasStartedStreaming = false;

      // Process streaming events
      for await (const event of stream) {
        // Handle response start
        if (event.type === 'response.created') {
          // Update to processing indicator
          animatedIndicator.update('processing');
        }

        // Handle web search events
        else if (event.type === 'response.function_call_in_progress' && enableWebSearch) {
          // Show web search in progress
          animatedIndicator.update('websearch');
        }

        // Handle function call completion (search results ready)
        else if (event.type === 'response.function_call_completed' && enableWebSearch) {
          // Brief confirmation before processing
          animatedIndicator.stop();
          console.log(chalk.green('🔍 ') + chalk.gray('Search completed - analyzing results...'));
          console.log('');
          animatedIndicator.start('processing');
        }

        // Handle when response starts generating
        else if (event.type === 'response.in_progress') {
          if (!hasStartedStreaming) {
            // Stop animation and prepare for streaming
            animatedIndicator.stop();
            console.log(''); // New line for response
            hasStartedStreaming = true;
          }
        }

        // Handle text delta events for real-time streaming
        else if (event.type === 'response.output_text.delta') {
          const delta = event.delta;
          if (delta) {
            if (!hasStartedStreaming) {
              // Stop animation on first text
              animatedIndicator.stop();
              console.log(''); // New line for response
              hasStartedStreaming = true;
            }
            process.stdout.write(chalk.white(delta));
            fullResponse += delta;
          }
        }

        // Handle errors
        else if (event.type === 'error') {
          // Stop animation and show error
          animatedIndicator.stop();
          console.log('');
          console.log(chalk.red('❌ Streaming error:'), event);
          throw new Error(`Streaming error: ${event.error?.message || 'Unknown error'}`);
        }

        // Handle completion
        else if (event.type === 'response.completed') {
          console.log(''); // New line after completion
        }
      }

      return fullResponse;

    } catch (error: any) {
      // Stop animation on error
      animatedIndicator.stop();
      console.log('');
      console.log(chalk.red('❌ Error during streaming:'), error.message);

      if (error.message.includes('quota') || error.message.includes('billing')) {
        console.log(chalk.yellow('💡 This might be a quota/billing issue. Check your OpenAI account.'));
      } else if (error.message.includes('organization')) {
        console.log(chalk.yellow('💡 This might be an organization setup issue.'));
      } else if (error.message.includes('model')) {
        console.log(chalk.yellow('💡 This might be a model access issue. GPT-5 requires verified org access.'));
      } else if (error.message.includes('401')) {
        console.log(chalk.yellow('💡 This might be an API key issue.'));
      }

      throw error;
    }
  }
}

// Lazy singleton instance
let _openAIStreaming: OpenAIStreaming | null = null;
export const openAIStreaming = {
  streamResponse: (...args: Parameters<OpenAIStreaming['streamResponse']>) => {
    if (!_openAIStreaming) {
      _openAIStreaming = new OpenAIStreaming();
    }
    return _openAIStreaming.streamResponse(...args);
  }
};