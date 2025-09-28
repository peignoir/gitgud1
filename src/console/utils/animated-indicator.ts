import chalk from 'chalk';

export class AnimatedIndicator {
  private interval: NodeJS.Timeout | null = null;
  private frame = 0;
  private isActive = false;
  private currentMessage = '';

  // Different animation types
  private readonly thinkingFrames = [
    chalk.cyan('🤔 ') + chalk.gray('Thinking   '),
    chalk.cyan('🤔 ') + chalk.gray('Thinking.  '),
    chalk.cyan('🤔 ') + chalk.gray('Thinking.. '),
    chalk.cyan('🤔 ') + chalk.gray('Thinking...'),
    chalk.cyan('🤔 ') + chalk.gray('Thinking.. '),
    chalk.cyan('🤔 ') + chalk.gray('Thinking.  ')
  ];

  private readonly processingFrames = [
    chalk.magenta('💭 ') + chalk.gray('Processing   '),
    chalk.magenta('💭 ') + chalk.gray('Processing.  '),
    chalk.magenta('💭 ') + chalk.gray('Processing.. '),
    chalk.magenta('💭 ') + chalk.gray('Processing...'),
    chalk.magenta('💭 ') + chalk.gray('Processing.. '),
    chalk.magenta('💭 ') + chalk.gray('Processing.  ')
  ];

  private readonly routingFrames = [
    chalk.yellow('🧠 ') + chalk.gray('Routing to best agent   '),
    chalk.yellow('🧠 ') + chalk.gray('Routing to best agent.  '),
    chalk.yellow('🧠 ') + chalk.gray('Routing to best agent.. '),
    chalk.yellow('🧠 ') + chalk.gray('Routing to best agent...'),
    chalk.yellow('🧠 ') + chalk.gray('Routing to best agent.. '),
    chalk.yellow('🧠 ') + chalk.gray('Routing to best agent.  ')
  ];

  private readonly webSearchFrames = [
    chalk.green('🔍 ') + chalk.gray('Searching startup wisdom   '),
    chalk.green('🔍 ') + chalk.gray('Searching startup wisdom.  '),
    chalk.green('🔍 ') + chalk.gray('Searching startup wisdom.. '),
    chalk.green('🔍 ') + chalk.gray('Searching startup wisdom...'),
    chalk.green('🔍 ') + chalk.gray('Searching startup wisdom.. '),
    chalk.green('🔍 ') + chalk.gray('Searching startup wisdom.  ')
  ];

  private readonly mentorSearchFrames = [
    chalk.blue('📚 ') + chalk.gray('Consulting Steve Blank, Eric Ries...   '),
    chalk.blue('📚 ') + chalk.gray('Consulting Steve Blank, Eric Ries....  '),
    chalk.blue('📚 ') + chalk.gray('Consulting Steve Blank, Eric Ries..... '),
    chalk.blue('📚 ') + chalk.gray('Consulting Steve Blank, Eric Ries......'),
    chalk.blue('📚 ') + chalk.gray('Consulting Steve Blank, Eric Ries..... '),
    chalk.blue('📚 ') + chalk.gray('Consulting Steve Blank, Eric Ries....  ')
  ];

  private readonly analystSearchFrames = [
    chalk.cyan('📈 ') + chalk.gray('Analyzing market intelligence...   '),
    chalk.cyan('📈 ') + chalk.gray('Analyzing market intelligence....  '),
    chalk.cyan('📈 ') + chalk.gray('Analyzing market intelligence..... '),
    chalk.cyan('📈 ') + chalk.gray('Analyzing market intelligence......'),
    chalk.cyan('📈 ') + chalk.gray('Analyzing market intelligence..... '),
    chalk.cyan('📈 ') + chalk.gray('Analyzing market intelligence....  ')
  ];

  private readonly scoringSearchFrames = [
    chalk.yellow('💰 ') + chalk.gray('Researching investment data...   '),
    chalk.yellow('💰 ') + chalk.gray('Researching investment data....  '),
    chalk.yellow('💰 ') + chalk.gray('Researching investment data..... '),
    chalk.yellow('💰 ') + chalk.gray('Researching investment data......'),
    chalk.yellow('💰 ') + chalk.gray('Researching investment data..... '),
    chalk.yellow('💰 ') + chalk.gray('Researching investment data....  ')
  ];

  private readonly asciiThinkingFrames = [
    chalk.cyan('   .-""""""-.   \n') + chalk.cyan('  /          \\  \n') + chalk.cyan(' |  O      O  | \n') + chalk.cyan(' |      <>    | \n') + chalk.cyan('  \\    ___   /  \n') + chalk.cyan('   "-.......-"   ') + chalk.gray(' Hmm...'),
    chalk.cyan('   .-""""""-.   \n') + chalk.cyan('  /          \\  \n') + chalk.cyan(' |  -      -  | \n') + chalk.cyan(' |      <>    | \n') + chalk.cyan('  \\    ___   /  \n') + chalk.cyan('   "-.......-"   ') + chalk.gray(' Thinking...'),
    chalk.cyan('   .-""""""-.   \n') + chalk.cyan('  /          \\  \n') + chalk.cyan(' |  O      O  | \n') + chalk.cyan(' |      <>    | \n') + chalk.cyan('  \\    ___   /  \n') + chalk.cyan('   "-.......-"   ') + chalk.gray(' Processing...')
  ];

  private getCurrentFrames(): string[] {
    switch (this.currentMessage) {
      case 'routing': return this.routingFrames;
      case 'processing': return this.processingFrames;
      case 'websearch': return this.webSearchFrames;
      case 'mentorsearch': return this.mentorSearchFrames;
      case 'analystsearch': return this.analystSearchFrames;
      case 'scoringsearch': return this.scoringSearchFrames;
      case 'ascii': return this.asciiThinkingFrames;
      default: return this.thinkingFrames;
    }
  }

  start(messageType: string = 'thinking'): void {
    if (this.isActive) return;

    this.isActive = true;
    this.frame = 0;
    this.currentMessage = messageType;

    // Clear any existing content and start fresh
    process.stdout.write('\n');

    this.interval = setInterval(() => {
      const frames = this.getCurrentFrames();
      const currentFrame = frames[this.frame];

      // Clear current content and redraw
      if (messageType === 'ascii') {
        // For ASCII art, clear multiple lines
        process.stdout.write('\r\x1b[6A'); // Move up 6 lines
        process.stdout.write('\x1b[0J'); // Clear from cursor down
        process.stdout.write(currentFrame);
      } else {
        // For single line indicators
        process.stdout.write('\r' + ' '.repeat(50) + '\r');
        process.stdout.write(currentFrame);
      }

      // Move to next frame
      this.frame = (this.frame + 1) % frames.length;
    }, 300); // Slower animation for better readability
  }

  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    // Clear the indicator properly
    if (this.currentMessage === 'ascii') {
      process.stdout.write('\r\x1b[6A\x1b[0J'); // Clear ASCII art
    } else {
      process.stdout.write('\r' + ' '.repeat(50) + '\r'); // Clear line
    }
  }

  update(messageType: string): void {
    if (!this.isActive) return;

    // Stop current animation and start new one
    this.stop();
    this.start(messageType);
  }
}

// Singleton instance
export const animatedIndicator = new AnimatedIndicator();