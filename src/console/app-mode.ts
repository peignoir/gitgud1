#!/usr/bin/env node

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { openAIStreaming } from './utils/openai-streaming';
import { globalModelManager } from './config/models';
import { globalResponseLength } from './utils/response-length';

// Load environment variables
dotenv.config();

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentType: 'scout' | 'analyst' | 'mentor' | 'scoring';
}

interface Session {
  id: string;
  currentAgent: 'scout' | 'analyst' | 'mentor' | 'scoring';
  messages: Message[];
  isSearching: boolean;
}

class AppMode {
  private app: express.Application;
  private server: any;
  private io: Server;
  private sessions: Map<string, Session> = new Map();
  private port: number = 3001;
  private nextjsProcess: any;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupExpress();
    this.setupWebSocket();
  }

  private startNextJS(): void {
    console.log(chalk.blue('🔄 Starting Next.js development server...'));

    this.nextjsProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(process.cwd(), 'mobile-app'),
      stdio: 'pipe',
      shell: true
    });

    this.nextjsProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      if (output.includes('Ready in')) {
        console.log(chalk.green('✅ Next.js development server ready'));
      }
    });

    this.nextjsProcess.stderr?.on('data', (data: Buffer) => {
      // Suppress warnings but show errors
      const output = data.toString();
      if (!output.includes('Warning:')) {
        console.log(chalk.yellow('⚠️  Next.js:'), output);
      }
    });
  }

  private setupExpress(): void {
    this.app.use(express.json());

    // API routes
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', agents: 4, sessions: this.sessions.size });
    });

    // Proxy all other requests to Next.js dev server
    this.app.use('*', (req, res) => {
      const targetUrl = `http://localhost:3000${req.originalUrl}`;
      res.redirect(302, targetUrl);
    });
  }

  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      console.log(chalk.green(`📱 Client connected: ${socket.id}`));

      // Create new session
      socket.on('create-session', () => {
        const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const session: Session = {
          id: sessionId,
          currentAgent: 'scout',
          messages: [],
          isSearching: false
        };

        this.sessions.set(sessionId, session);
        socket.join(sessionId);

        console.log(chalk.cyan(`🆕 Session created: ${sessionId}`));
        socket.emit('session-created', { sessionId });
      });

      // Join existing session
      socket.on('join-session', ({ sessionId }) => {
        const session = this.sessions.get(sessionId);
        if (session) {
          socket.join(sessionId);
          socket.emit('session-joined', {
            sessionId,
            currentAgent: session.currentAgent,
            messages: session.messages
          });
          console.log(chalk.blue(`👤 Client joined session: ${sessionId}`));
        } else {
          socket.emit('error', { message: 'Session not found' });
        }
      });

      // Switch agent
      socket.on('switch-agent', ({ sessionId, agentType }) => {
        const session = this.sessions.get(sessionId);
        if (session) {
          session.currentAgent = agentType;
          this.io.to(sessionId).emit('agent-switched', { agentType });
          console.log(chalk.yellow(`🔄 Agent switched to ${agentType} in session ${sessionId}`));
        }
      });

      // Handle messages
      socket.on('send-message', async ({ sessionId, content }) => {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        // Add user message
        const userMessage: Message = {
          id: Math.random().toString(36),
          role: 'user',
          content,
          timestamp: new Date(),
          agentType: session.currentAgent
        };

        session.messages.push(userMessage);
        this.io.to(sessionId).emit('new-message', userMessage);

        console.log(chalk.magenta(`💬 Message in ${sessionId}: ${content.substring(0, 50)}...`));

        try {
          // Set searching status
          const hasWebSearch = ['mentor', 'analyst', 'scoring'].includes(session.currentAgent);
          if (hasWebSearch) {
            session.isSearching = true;
            this.io.to(sessionId).emit('search-started');
          }

          // Generate response
          const response = await this.generateResponse(content, session);

          // Clear searching status
          if (hasWebSearch) {
            session.isSearching = false;
            this.io.to(sessionId).emit('search-completed');
          }

          // Add assistant message
          const assistantMessage: Message = {
            id: Math.random().toString(36),
            role: 'assistant',
            content: response,
            timestamp: new Date(),
            agentType: session.currentAgent
          };

          session.messages.push(assistantMessage);
          this.io.to(sessionId).emit('new-message', assistantMessage);

        } catch (error) {
          console.error(chalk.red('❌ Error generating response:'), error);
          session.isSearching = false;
          this.io.to(sessionId).emit('search-completed');

          const errorMessage: Message = {
            id: Math.random().toString(36),
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date(),
            agentType: session.currentAgent
          };

          session.messages.push(errorMessage);
          this.io.to(sessionId).emit('new-message', errorMessage);
        }
      });

      socket.on('disconnect', () => {
        console.log(chalk.gray(`👋 Client disconnected: ${socket.id}`));
      });
    });
  }

  private async generateResponse(message: string, session: Session): Promise<string> {
    // Get agent instructions
    const agentInstructions = this.getAgentInstructions(session.currentAgent);

    // Prepare conversation context
    const messages = [
      {
        role: 'system' as const,
        content: `${agentInstructions}\\n\\nRESPONSE LENGTH: ${globalResponseLength.getLengthInstruction()}\\n\\nCurrent time: ${new Date().toLocaleString()}`
      },
      // Add conversation history (last 8 messages)
      ...session.messages
        .slice(-8)
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
    ];

    // Configure web search for agents with search capabilities
    let searchOptions = {};

    if (session.currentAgent === 'mentor') {
      searchOptions = {
        enableWebSearch: true,
        allowedDomains: [
          'steveblank.com', 'theleanstartup.com', 'ericries.com',
          'paulgraham.com', 'ycombinator.com', 'techstars.com',
          'firstround.com', 'a16z.com', 'sequoiacap.com'
        ]
      };
    } else if (session.currentAgent === 'analyst') {
      searchOptions = {
        enableWebSearch: true,
        allowedDomains: [
          'mckinsey.com', 'bcg.com', 'bain.com', 'cbinsights.com',
          'pitchbook.com', 'crunchbase.com', 'statista.com',
          'gartner.com', 'forrester.com', 'techcrunch.com'
        ]
      };
    } else if (session.currentAgent === 'scoring') {
      searchOptions = {
        enableWebSearch: true,
        allowedDomains: [
          'angellist.com', 'crunchbase.com', 'pitchbook.com',
          'cbinsights.com', 'techcrunch.com', 'venturebeat.com',
          'fortune.com', 'forbes.com', 'bloomberg.com', 'wsj.com'
        ]
      };
    }

    // Get current model
    const currentModel = globalModelManager.getCurrentModel();

    // Stream the response using OpenAI Responses API
    return await openAIStreaming.streamResponse(messages, {
      model: currentModel.id,
      agentType: session.currentAgent,
      ...searchOptions
    });
  }

  private getAgentInstructions(agentType: 'scout' | 'analyst' | 'mentor' | 'scoring'): string {
    switch (agentType) {
      case 'scout':
        return "You are the SCOUT - an expert researcher and information gatherer. Focus on research, exploration, trends, and competitive intelligence. Provide structured analysis with data sources and actionable insights.";

      case 'analyst':
        return "You are the ANALYST - a strategic thinker with market intelligence web search access. ALWAYS search for current market data before answering. Provide data-driven insights, strategic analysis, and clear recommendations.";

      case 'mentor':
        return "You are the MENTOR - a startup guide with web search access to the best startup wisdom. ALWAYS search for latest insights from Steve Blank, Eric Ries, Paul Graham, Y Combinator before answering. Provide evidence-based guidance with specific citations.";

      case 'scoring':
        return "You are the SCORING AGENT - a Silicon Valley angel investor with web search access to investment data. ALWAYS search for market data and competitive intelligence before scoring. Rate ideas 0-100 using: Market Opportunity (30pts), Team & Execution (25pts), Product & Technology (20pts), Business Model (15pts), Competition (10pts). Include investment recommendation and confidence level.";

      default:
        return 'You are a helpful AI assistant.';
    }
  }

  async start(): Promise<void> {
    if (!process.env.OPENAI_API_KEY) {
      console.log(chalk.red('❌ Error: OPENAI_API_KEY not found in environment variables'));
      console.log(chalk.gray('Please set your OpenAI API key in .env file:'));
      console.log(chalk.gray('OPENAI_API_KEY=your_key_here'));
      process.exit(1);
    }

    // Start Next.js development server first
    this.startNextJS();

    // Start WebSocket server
    this.server.listen(this.port, () => {
      console.log(chalk.cyan.bold('🚀 GitGud AI App Mode'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.green(`📱 Mobile app with authentication: http://localhost:3000`));
      console.log(chalk.blue(`🔌 WebSocket server ready on: http://localhost:${this.port}`));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.white('Available agents:'));
      console.log(chalk.blue('  🕵️  Scout   - Research and exploration'));
      console.log(chalk.blue('  📊 Analyst - Strategic analysis + market intelligence'));
      console.log(chalk.blue('  🧭 Mentor  - Startup guidance + wisdom search'));
      console.log(chalk.blue('  💰 Scoring - Angel investor evaluation'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.yellow('Press Ctrl+C to stop both servers'));
      console.log('');
    });

    // Handle shutdown gracefully
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n🛑 Shutting down servers...'));
      if (this.nextjsProcess) {
        this.nextjsProcess.kill();
      }
      process.exit(0);
    });
  }
}

// Start app mode if this file is run directly
if (require.main === module) {
  const appMode = new AppMode();
  appMode.start().catch(console.error);
}

export { AppMode };