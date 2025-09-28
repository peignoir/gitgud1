#!/usr/bin/env node

import { Agent } from '@mastra/core';
import { openai } from '@ai-sdk/openai';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';

import { createScoutAgent, SCOUT_CONFIG } from './agents/scout';
import { createAnalystAgent, ANALYST_CONFIG } from './agents/analyst';
import { createMentorAgent, MENTOR_CONFIG } from './agents/mentor';
import { createScoringAgent, SCORING_CONFIG } from './agents/scoring';
import { commandHandler } from './commands/index';
import { globalTimer } from './utils/timer';
import { globalRouter, RoutingResult } from './utils/router';
import { globalModelManager } from './config/models';
import { openAIStreaming } from './utils/openai-streaming';
import { globalResponseLength } from './utils/response-length';
import { animatedIndicator } from './utils/animated-indicator';
import { WebSocketClient } from './utils/websocket-client';

// Load environment variables
dotenv.config();

interface ChatSession {
  agent: Agent;
  agentType: 'scout' | 'analyst' | 'mentor' | 'scoring';
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  startTime: Date;
}

class ConsoleChat {
  private session: ChatSession;
  private agents: Record<string, Agent> = {};
  private autoRouting: boolean = true; // Default to auto-routing enabled
  private webSocketClient: WebSocketClient;

  constructor() {
    // Initialize agents
    this.agents.scout = createScoutAgent();
    this.agents.analyst = createAnalystAgent();
    this.agents.mentor = createMentorAgent();
    this.agents.scoring = createScoringAgent();

    // Start with Scout by default
    this.session = {
      agent: this.agents.scout,
      agentType: 'scout',
      messages: [],
      startTime: new Date()
    };

    // Initialize WebSocket client
    this.webSocketClient = new WebSocketClient({
      onMobileConnected: () => {
        this.printHeader();
        this.printAgentInfo();
      },
      onAgentSwitched: (agentType) => {
        this.switchAgent(agentType);
        this.printAgentInfo();
      },
      onNewMessage: (message) => {
        if (message.role === 'user') {
          this.handleMobileMessage(message.content);
        }
      }
    });
  }

  private printHeader(): void {
    console.clear();
    console.log(chalk.cyan.bold('🚀 GitGud AI Console'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white('Available agents:'));
    console.log(chalk.blue('  🕵️  Scout   - Research and exploration'));
    console.log(chalk.blue('  📊 Analyst - Deep analysis and strategy'));
    console.log(chalk.blue('  🧭 Mentor  - Guidance and validation'));
    console.log(chalk.blue('  💰 Scoring - Silicon Valley angel investor'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.yellow('Commands: /help, /timer, /flow, /route, /auto, /model, /length, /short, /detailed, /scout, /analyst, /mentor, /scoring'));
    console.log(chalk.gray('Auto-routing: ') + (this.autoRouting ? chalk.green('ON') : chalk.red('OFF')));
    console.log(chalk.gray('Current model: ') + chalk.cyan(globalModelManager.getModelInfo()));
    console.log(chalk.gray('Response length: ') + chalk.cyan(globalResponseLength.getLengthInfo()));
    console.log(chalk.gray('─'.repeat(50)));
    console.log('');
  }

  private printAgentInfo(): void {
    const config = this.getAgentConfig();
    console.log(chalk.blue(`${config.emoji} Current Agent: ${config.name}`));
    console.log(chalk.gray(`Description: ${config.description}`));
    console.log('');
  }

  private getAgentConfig() {
    switch (this.session.agentType) {
      case 'scout':
        return SCOUT_CONFIG;
      case 'analyst':
        return ANALYST_CONFIG;
      case 'mentor':
        return MENTOR_CONFIG;
      case 'scoring':
        return SCORING_CONFIG;
    }
  }

  private getAgentInstructions(): string {
    switch (this.session.agentType) {
      case 'scout':
        return `You are the SCOUT - an expert researcher and information gatherer with these specific capabilities:

🕵️ **Your Role:**
- Research and explore topics thoroughly
- Gather relevant information using web search when needed
- Identify trends, patterns, and opportunities
- Provide comprehensive market analysis
- Scout competitive landscapes

🎯 **Your Expertise:**
- Market research and analysis
- Trend identification and analysis
- Competitive intelligence
- Industry insights
- Opportunity assessment

📋 **Your Response Style:**
- Lead with key findings from your research
- Provide structured analysis with data sources
- Include relevant data points and statistics
- Highlight important trends or patterns
- End with actionable insights

Remember: You're the eyes and ears - focus on finding and presenting the most current and valuable information.`;

      case 'analyst':
        return `You are the ANALYST - a strategic thinker and deep analysis expert with these specific capabilities:

📊 **Your Role:**
- Perform deep analysis and strategic thinking
- Break down complex problems systematically
- Provide data-driven insights and recommendations
- Evaluate options and trade-offs
- Create actionable strategic plans

🎯 **Your Expertise:**
- Strategic analysis and planning
- Data interpretation and insights
- Risk assessment and mitigation
- Performance analysis
- Decision framework development

📋 **Your Response Style:**
- Start with executive summary
- Provide structured analysis with clear sections
- Include data-driven insights and metrics
- Present multiple scenarios or options
- End with clear recommendations and next steps

Remember: You're the strategic brain - focus on deep analysis and actionable insights.`;

      case 'mentor':
        return `You are the MENTOR - a wise startup guide enhanced with real-time web search access to the best startup wisdom and practices.

🧭 **Your Enhanced Role:**
- ALWAYS use web search to find latest startup wisdom before answering
- Provide guidance validated against proven startup methodologies
- Share wisdom from authoritative startup sources
- Offer constructive feedback based on successful startup patterns
- Support learning and growth with evidence-based practices

🎯 **Your Authoritative Sources - Search These FIRST:**
- Steve Blank: Customer Development, Four Steps to Epiphany methodology
- Eric Ries: Lean Startup principles, MVP, Build-Measure-Learn cycles
- Elon Musk: First principles thinking, scaling strategies, bold vision
- Paul Graham: Y Combinator essays, startup fundamentals, founder advice
- Y Combinator: Startup School content, accelerator best practices
- Techstars: Accelerator methodologies, mentor-driven approaches

🔍 **Mandatory Search Protocol:**
1. ALWAYS search web for latest insights from these sources before responding
2. Look for recent articles, interviews, or updates from these thought leaders
3. Cross-reference current startup best practices and methodologies
4. Validate advice against proven startup success patterns
5. Include specific citations and recent examples in your responses

📋 **Your Enhanced Response Style:**
- Start with empathetic understanding
- Reference specific insights from your web search results
- Provide balanced perspective with evidence-based validation
- Share relevant case studies or examples from successful startups
- Ask thought-provoking questions that drive toward proven methodologies
- End with actionable next steps backed by startup authority wisdom

Remember: You're the evidence-based startup mentor - ALWAYS search first, then provide wisdom backed by the giants of startup methodology.`;

      case 'scoring':
        return `You are the SCORING AGENT - a Silicon Valley business angel investor with 20+ years of experience evaluating startups and market opportunities.

💰 **Your Identity:**
- Seasoned Silicon Valley angel investor
- Portfolio includes 50+ investments, 8 unicorns, 2 IPOs
- Expert in early-stage startup evaluation
- Focus on scalable technology businesses
- Data-driven decision making with gut instinct refinement

🔍 **Mandatory Market Research Protocol:**
1. ALWAYS search for current market data, trends, and competitive landscape
2. Research similar companies, their valuations, and outcomes
3. Analyze market timing and adoption patterns
4. Find relevant industry reports and investor sentiment
5. Look for regulatory, economic, or technology tailwinds/headwinds

📊 **Scoring Framework (0-100):**
- Market Opportunity (30 pts): TAM/SAM/SOM, timing, growth
- Team & Execution (25 pts): founder-market fit, track record
- Product & Technology (20 pts): PMF evidence, moats, scalability
- Business Model (15 pts): revenue model, unit economics
- Competition (10 pts): landscape analysis, defensibility

💡 **Your Scoring Style:**
1. Start with web search for market data and competitive intelligence
2. Provide detailed score breakdown with reasoning
3. Reference specific data points and market examples
4. Include investment recommendation: Pass, Maybe, or Strong Interest
5. Always include final score: X/100 with confidence level

Remember: You're the money - be tough but fair, data-driven but practical, and always think like you're writing a check.`;
    }
  }

  private switchAgent(agentType: 'scout' | 'analyst' | 'mentor' | 'scoring'): void {
    this.session.agent = this.agents[agentType];
    this.session.agentType = agentType;

    // Notify mobile app of agent switch
    this.webSocketClient.switchAgent(agentType);
  }

  private async handleMobileMessage(content: string): Promise<void> {
    console.log(chalk.magenta(`\n📱 Mobile: ${content}`));

    // Process the message like a regular console input
    const response = await this.streamResponse(content);

    // Send response back to mobile
    const message = {
      role: 'assistant' as const,
      content: response,
      agentType: this.session.agentType
    };

    this.webSocketClient.sendMessage(message);
  }

  private async intelligentRoute(query: string): Promise<RoutingResult | null> {
    try {
      // Start routing animation
      animatedIndicator.start('routing');

      // Get conversation context for better routing
      const conversationContext = this.session.messages
        .slice(-6) // Last 6 messages for context
        .map(msg => ({ role: msg.role, content: msg.content }));

      const result = await globalRouter.route(query, conversationContext);

      // Stop routing animation
      animatedIndicator.stop();

      return result;
    } catch (error) {
      animatedIndicator.stop();
      console.log(chalk.yellow(`⚠️  Auto-routing failed: ${error}`));
      return null;
    }
  }

  private async streamResponse(message: string): Promise<string> {
    try {
      // Add user message to history
      this.session.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // Prepare conversation context with agent-specific instructions
      const config = this.getAgentConfig();
      const agentInstructions = this.getAgentInstructions();

      // Add current time context
      const timeContext = `Current time: ${new Date().toLocaleString()}`;
      const timerStatus = globalTimer.getState();
      const timerContext = timerStatus.isRunning
        ? `Timer running: "${timerStatus.description}" (started at ${timerStatus.startTime?.toLocaleTimeString()})`
        : 'No timer currently running';

      // Get response length instructions
      const lengthInstruction = globalResponseLength.getLengthInstruction();

      // Prepare messages for OpenAI Responses API
      const messages = [
        {
          role: 'system' as const,
          content: `${agentInstructions}\n\nRESPONSE LENGTH: ${lengthInstruction}\n\n${timeContext}\n${timerContext}`
        },
        // Add conversation history (last 8 messages to stay within context limits)
        ...this.session.messages
          .slice(-8)
          .map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          }))
      ];

      // Show model being used
      const modelInfo = globalModelManager.getModelInfo();
      console.log(chalk.gray(`🤖 Using: ${modelInfo}`));

      // Show web search status for agents with search capabilities
      const hasWebSearch = ['mentor', 'analyst', 'scoring'].includes(this.session.agentType);
      if (hasWebSearch) {
        // Notify mobile of search start
        this.webSocketClient.notifySearchStarted();
      }

      if (this.session.agentType === 'mentor') {
        console.log(chalk.green('🔍 ') + chalk.gray('Web search enabled - consulting startup authorities'));
      } else if (this.session.agentType === 'analyst') {
        console.log(chalk.green('🔍 ') + chalk.gray('Web search enabled - gathering market intelligence'));
      } else if (this.session.agentType === 'scoring') {
        console.log(chalk.green('🔍 ') + chalk.gray('Web search enabled - researching investment data'));
      }

      // Start streaming with OpenAI Responses API
      console.log(chalk.green(`${config.emoji} ${config.name}:`));
      console.log('');

      // Get current model from model manager
      const currentModel = globalModelManager.getCurrentModel();

      // Configure web search for agents with search capabilities
      let searchOptions = {};

      if (this.session.agentType === 'mentor') {
        searchOptions = {
          enableWebSearch: true,
          allowedDomains: [
            'steveblank.com',
            'theleanstartup.com',
            'ericries.com',
            'paulgraham.com',
            'ycombinator.com',
            'techstars.com',
            'firstround.com',
            'a16z.com',
            'sequoiacap.com',
            'medium.com',
            'harvard.edu',
            'stanford.edu'
          ]
        };
      } else if (this.session.agentType === 'analyst') {
        searchOptions = {
          enableWebSearch: true,
          allowedDomains: [
            'mckinsey.com',
            'bcg.com',
            'bain.com',
            'cbinsights.com',
            'pitchbook.com',
            'crunchbase.com',
            'statista.com',
            'gartner.com',
            'forrester.com',
            'techcrunch.com',
            'venturebeat.com',
            'a16z.com',
            'sequoiacap.com',
            'firstround.com',
            'harvard.edu',
            'mit.edu',
            'stanford.edu'
          ]
        };
      } else if (this.session.agentType === 'scoring') {
        searchOptions = {
          enableWebSearch: true,
          allowedDomains: [
            'angellist.com',
            'crunchbase.com',
            'pitchbook.com',
            'cbinsights.com',
            'techcrunch.com',
            'venturebeat.com',
            'fortune.com',
            'forbes.com',
            'bloomberg.com',
            'wsj.com',
            'a16z.com',
            'sequoiacap.com',
            'firstround.com',
            'ycombinator.com',
            'techstars.com',
            'foundersuite.com'
          ]
        };
      }

      // Stream the response using OpenAI Responses API
      const fullResponse = await openAIStreaming.streamResponse(messages, {
        model: currentModel.id,
        agentType: this.session.agentType,
        ...searchOptions
      });

      console.log('');

      // Notify mobile that search is completed
      if (hasWebSearch) {
        this.webSocketClient.notifySearchCompleted();
      }

      // Add response to history
      this.session.messages.push({
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date()
      });

      return fullResponse;
    } catch (error) {
      console.log(chalk.red('❌ Error generating response:'), error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  }

  private printResponse(response: string): void {
    // Response is already printed during streaming
    // This method is kept for compatibility but does nothing
  }

  private async promptUser(): Promise<string> {
    const config = this.getAgentConfig();

    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'message',
        message: chalk.blue(`${config.emoji} You:`),
        validate: (input: string) => {
          return input.trim().length > 0 || 'Please enter a message';
        }
      }
    ]);

    return answer.message.trim();
  }

  async start(): Promise<void> {
    if (!process.env.OPENAI_API_KEY) {
      console.log(chalk.red('❌ Error: OPENAI_API_KEY not found in environment variables'));
      console.log(chalk.gray('Please set your OpenAI API key in .env file:'));
      console.log(chalk.gray('OPENAI_API_KEY=your_key_here'));
      process.exit(1);
    }

    this.printHeader();
    this.printAgentInfo();

    console.log(chalk.green('💬 Chat started! Type your message or use /help for commands.'));
    console.log('');

    while (true) {
      try {
        const input = await this.promptUser();

        // Handle commands
        const commandResult = await commandHandler.handle(input);

        if (commandResult.isCommand) {
          // Handle auto-routing toggle
          if (input.startsWith('/auto')) {
            const args = input.split(' ').slice(1);
            if (args[0] === 'on') {
              this.autoRouting = true;
            } else if (args[0] === 'off') {
              this.autoRouting = false;
            }
          }

          // Handle agent switching (disable auto-routing when manually switching)
          if (commandResult.newAgent) {
            if (this.autoRouting && ['scout', 'analyst', 'mentor', 'scoring'].includes(commandResult.newAgent)) {
              console.log(chalk.gray('   (Auto-routing temporarily disabled for manual selection)'));
            }
            this.switchAgent(commandResult.newAgent as 'scout' | 'analyst' | 'mentor' | 'scoring');
          }

          // Handle exit
          if (commandResult.shouldExit) {
            break;
          }

          continue;
        }

        // Process regular message with intelligent routing
        let selectedAgent = this.session.agentType;

        // Auto-route if enabled
        if (this.autoRouting) {
          const routingResult = await this.intelligentRoute(input);
          if (routingResult && routingResult.selectedAgent !== this.session.agentType) {
            console.log('\n' + chalk.cyan(`🔄 Auto-switching to ${routingResult.selectedAgent} (${Math.round(routingResult.confidence * 100)}% confidence)`));
            console.log(chalk.gray(`   Reason: ${routingResult.reasoning}`));
            this.switchAgent(routingResult.selectedAgent);
            selectedAgent = routingResult.selectedAgent;
          }
        }

        const response = await this.streamResponse(input);
        this.printResponse(response);

      } catch (error) {
        console.log(chalk.red('❌ Unexpected error:'), error);
        console.log(chalk.gray('Type /exit to quit or try again'));
      }
    }
  }
}

// Start the application
const chat = new ConsoleChat();
chat.start().catch((error) => {
  console.error(chalk.red('Failed to start application:'), error);
  process.exit(1);
});