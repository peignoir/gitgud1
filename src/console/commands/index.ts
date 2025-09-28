import chalk from 'chalk';
import { globalTimer } from '../utils/timer';
import { globalRouter } from '../utils/router';
import { globalModelManager, AVAILABLE_MODELS } from '../config/models';
import { globalResponseLength, RESPONSE_LENGTH_CONFIGS } from '../utils/response-length';

export interface Command {
  name: string;
  description: string;
  usage: string;
  execute: (args: string[]) => Promise<boolean> | boolean;
}

export class CommandHandler {
  private commands: Map<string, Command> = new Map();

  constructor() {
    this.registerDefaultCommands();
  }

  private registerDefaultCommands(): void {
    // Timer commands
    this.register({
      name: 'timer',
      description: 'Timer functionality',
      usage: '/timer [start|stop|status] [description]',
      execute: (args: string[]) => {
        const action = args[0];
        const description = args.slice(1).join(' ');

        switch (action) {
          case 'start':
            globalTimer.start(description || 'Work session');
            break;
          case 'stop':
            globalTimer.stop();
            break;
          case 'status':
            globalTimer.status();
            break;
          default:
            console.log(chalk.yellow('Usage: /timer [start|stop|status] [description]'));
            console.log(chalk.gray('  start  - Start a new timer with optional description'));
            console.log(chalk.gray('  stop   - Stop the current timer'));
            console.log(chalk.gray('  status - Show current timer status'));
        }
        return false; // Don't exit
      }
    });

    // Help command
    this.register({
      name: 'help',
      description: 'Show available commands',
      usage: '/help [command]',
      execute: (args: string[]) => {
        if (args[0]) {
          const command = this.commands.get(args[0]);
          if (command) {
            console.log(chalk.cyan(`Command: /${command.name}`));
            console.log(chalk.gray(`Description: ${command.description}`));
            console.log(chalk.gray(`Usage: ${command.usage}`));
          } else {
            console.log(chalk.red(`Command '${args[0]}' not found`));
          }
        } else {
          console.log(chalk.cyan('Available commands:'));
          for (const [name, command] of this.commands) {
            console.log(chalk.white(`  /${name}`) + chalk.gray(` - ${command.description}`));
          }
          console.log(chalk.gray('\nType /help <command> for detailed usage'));
        }
        return false; // Don't exit
      }
    });

    // Clear command
    this.register({
      name: 'clear',
      description: 'Clear the console',
      usage: '/clear',
      execute: () => {
        console.clear();
        return false; // Don't exit
      }
    });

    // Exit command
    this.register({
      name: 'exit',
      description: 'Exit the application',
      usage: '/exit',
      execute: () => {
        console.log(chalk.green('👋 Goodbye!'));
        return true; // Exit
      }
    });

    // Quit command (alias for exit)
    this.register({
      name: 'quit',
      description: 'Exit the application',
      usage: '/quit',
      execute: () => {
        console.log(chalk.green('👋 Goodbye!'));
        return true; // Exit
      }
    });

    // Agent switch commands
    this.register({
      name: 'scout',
      description: 'Switch to Scout agent',
      usage: '/scout',
      execute: () => {
        console.log(chalk.blue('🕵️  Switched to Scout agent'));
        return false;
      }
    });

    this.register({
      name: 'analyst',
      description: 'Switch to Analyst agent',
      usage: '/analyst',
      execute: () => {
        console.log(chalk.blue('📊 Switched to Analyst agent'));
        return false;
      }
    });

    this.register({
      name: 'mentor',
      description: 'Switch to Mentor agent',
      usage: '/mentor',
      execute: () => {
        console.log(chalk.blue('🧭 Switched to Mentor agent'));
        return false;
      }
    });

    this.register({
      name: 'scoring',
      description: 'Switch to Scoring agent (Silicon Valley angel investor)',
      usage: '/scoring',
      execute: () => {
        console.log(chalk.blue('💰 Switched to Scoring agent'));
        return false;
      }
    });

    // Router and flow commands
    this.register({
      name: 'flow',
      description: 'Show agent routing flow diagram',
      usage: '/flow',
      execute: () => {
        console.log(chalk.cyan(globalRouter.getFlowDiagram()));
        return false;
      }
    });

    this.register({
      name: 'stats',
      description: 'Show routing statistics and capabilities',
      usage: '/stats',
      execute: () => {
        console.log(chalk.cyan(globalRouter.getRoutingStats()));
        return false;
      }
    });

    this.register({
      name: 'route',
      description: 'Test agent routing for a query',
      usage: '/route <query>',
      execute: async (args: string[]) => {
        const query = args.join(' ');
        if (!query.trim()) {
          console.log(chalk.yellow('Usage: /route <your query>'));
          console.log(chalk.gray('Example: /route "What are the latest AI trends?"'));
          return false;
        }

        console.log(chalk.blue(`🧠 Analyzing: "${query}"`));
        try {
          const result = await globalRouter.route(query);
          console.log(chalk.green(`\n📍 Routing Result:`));
          console.log(chalk.white(`   Agent: ${result.selectedAgent} (${Math.round(result.confidence * 100)}%)`));
          console.log(chalk.white(`   Reasoning: ${result.reasoning}`));
          console.log(chalk.white(`   Suggested Flow: ${result.suggestedFlow.join(' → ')}`));
        } catch (error) {
          console.log(chalk.red(`❌ Routing failed: ${error}`));
        }
        return false;
      }
    });

    this.register({
      name: 'auto',
      description: 'Toggle automatic agent routing',
      usage: '/auto [on|off]',
      execute: (args: string[]) => {
        const setting = args[0];
        if (setting === 'on') {
          console.log(chalk.green('✅ Automatic agent routing enabled'));
          console.log(chalk.gray('   Agents will be auto-selected based on your queries'));
        } else if (setting === 'off') {
          console.log(chalk.yellow('🔒 Manual agent selection enabled'));
          console.log(chalk.gray('   Use /scout, /analyst, /mentor to switch agents'));
        } else {
          console.log(chalk.cyan('Auto-routing Settings:'));
          console.log(chalk.gray('  /auto on  - Enable automatic agent selection'));
          console.log(chalk.gray('  /auto off - Use manual agent switching'));
          console.log(chalk.gray('  /route <query> - Test routing for a specific query'));
        }
        return false;
      }
    });

    // Model switching commands
    this.register({
      name: 'model',
      description: 'Switch AI model globally',
      usage: '/model [gpt-4o|gpt-5|gemini-2.5-pro|claude-opus-4-1|list]',
      execute: (args: string[]) => {
        const modelId = args[0];

        if (!modelId || modelId === 'list') {
          console.log(chalk.cyan('Available AI models:'));
          const models = globalModelManager.getAvailableModels();
          const current = globalModelManager.getCurrentModel();

          for (const model of models) {
            const isCurrent = model.id === current.id;
            const prefix = isCurrent ? chalk.green('  ● ') : chalk.gray('  ○ ');
            console.log(prefix + chalk.white(`${model.name} (${model.provider}) - ${model.description}`));
          }
          console.log(chalk.gray('\nUsage: /model <model-id>'));
          return false;
        }

        // Map user-friendly names to actual model IDs
        const modelMap: Record<string, string> = {
          'gpt-4o': 'gpt-4o',
          'gpt-5': 'gpt-5',
          'gemini': 'gemini-2.5-pro',
          'gemini-2.5-pro': 'gemini-2.5-pro',
          'claude': 'claude-opus-4-1',
          'claude-opus-4-1': 'claude-opus-4-1'
        };

        const actualModelId = modelMap[modelId] || modelId;

        if (globalModelManager.setModel(actualModelId)) {
          const newModel = globalModelManager.getCurrentModel();
          console.log(chalk.green(`✅ Switched to ${newModel.name} (${newModel.provider})`));
          console.log(chalk.gray(`   ${newModel.description}`));
          console.log(chalk.yellow('   Note: New model will take effect on agent restart/recreation'));
        } else {
          console.log(chalk.red(`❌ Unknown model: ${modelId}`));
          console.log(chalk.gray('   Use /model list to see available models'));
        }
        return false;
      }
    });

    this.register({
      name: 'models',
      description: 'List available AI models (alias for /model list)',
      usage: '/models',
      execute: () => {
        console.log(chalk.cyan('Available AI models:'));
        const models = globalModelManager.getAvailableModels();
        const current = globalModelManager.getCurrentModel();

        for (const model of models) {
          const isCurrent = model.id === current.id;
          const prefix = isCurrent ? chalk.green('  ● ') : chalk.gray('  ○ ');
          console.log(prefix + chalk.white(`${model.name} (${model.provider}) - ${model.description}`));
        }
        console.log(chalk.gray('\nCurrent: ') + chalk.green(globalModelManager.getModelInfo()));
        return false;
      }
    });

    // Response length commands
    this.register({
      name: 'length',
      description: 'Set response length preference',
      usage: '/length [short|medium|detailed|next|list]',
      execute: (args: string[]) => {
        const action = args[0];

        if (!action || action === 'list') {
          console.log(chalk.cyan('Response Length Settings:'));
          const configs = Object.values(RESPONSE_LENGTH_CONFIGS);
          const current = globalResponseLength.getCurrentLength();

          for (const config of configs) {
            const isCurrent = current === Object.keys(RESPONSE_LENGTH_CONFIGS).find(
              key => RESPONSE_LENGTH_CONFIGS[key as keyof typeof RESPONSE_LENGTH_CONFIGS] === config
            );
            const prefix = isCurrent ? chalk.green('  ● ') : chalk.gray('  ○ ');
            console.log(prefix + chalk.white(`${config.emoji} ${config.name} - ${config.description}`));
          }
          console.log(chalk.gray('\nUsage: /length <short|medium|detailed>'));
          console.log(chalk.gray('       /length next (cycle through options)'));
          return false;
        }

        if (action === 'next') {
          const nextLength = globalResponseLength.getNextLength();
          globalResponseLength.setLength(nextLength);
          const config = globalResponseLength.getConfig();
          console.log(chalk.green(`✅ Response length: ${config.emoji} ${config.name} - ${config.description}`));
          return false;
        }

        // Map user input to valid length types
        const lengthMap: Record<string, string> = {
          'short': 'short',
          's': 'short',
          '1': 'short',
          'medium': 'medium',
          'med': 'medium',
          'm': 'medium',
          '2': 'medium',
          'detailed': 'detailed',
          'detail': 'detailed',
          'long': 'detailed',
          'd': 'detailed',
          '3': 'detailed'
        };

        const normalizedAction = lengthMap[action.toLowerCase()];

        if (normalizedAction && globalResponseLength.setLength(normalizedAction as any)) {
          const config = globalResponseLength.getConfig();
          console.log(chalk.green(`✅ Response length: ${config.emoji} ${config.name} - ${config.description}`));
        } else {
          console.log(chalk.red(`❌ Unknown length setting: ${action}`));
          console.log(chalk.gray('   Use /length list to see available options'));
        }
        return false;
      }
    });

    // Quick length shortcuts
    this.register({
      name: 'short',
      description: 'Set responses to short/concise mode',
      usage: '/short',
      execute: () => {
        globalResponseLength.setLength('short');
        const config = globalResponseLength.getConfig();
        console.log(chalk.green(`✅ ${config.emoji} ${config.name} responses enabled - ${config.description}`));
        return false;
      }
    });

    this.register({
      name: 'detailed',
      description: 'Set responses to detailed/comprehensive mode',
      usage: '/detailed',
      execute: () => {
        globalResponseLength.setLength('detailed');
        const config = globalResponseLength.getConfig();
        console.log(chalk.green(`✅ ${config.emoji} ${config.name} responses enabled - ${config.description}`));
        return false;
      }
    });
  }

  register(command: Command): void {
    this.commands.set(command.name, command);
  }

  async handle(input: string): Promise<{ isCommand: boolean; shouldExit: boolean; newAgent?: string }> {
    if (!input.startsWith('/')) {
      return { isCommand: false, shouldExit: false };
    }

    const parts = input.slice(1).trim().split(' ');
    const commandName = parts[0];
    const args = parts.slice(1);

    const command = this.commands.get(commandName);
    if (!command) {
      console.log(chalk.red(`Unknown command: /${commandName}`));
      console.log(chalk.gray('Type /help for available commands'));
      return { isCommand: true, shouldExit: false };
    }

    try {
      const shouldExit = await command.execute(args);

      // Check if this was an agent switch command
      let newAgent: string | undefined;
      if (['scout', 'analyst', 'mentor', 'scoring'].includes(commandName)) {
        newAgent = commandName;
      }

      return { isCommand: true, shouldExit: Boolean(shouldExit), newAgent };
    } catch (error) {
      console.log(chalk.red(`Error executing command: ${error}`));
      return { isCommand: true, shouldExit: false };
    }
  }
}

export const commandHandler = new CommandHandler();