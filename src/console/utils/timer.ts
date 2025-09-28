import chalk from 'chalk';

export interface TimerState {
  startTime: Date | null;
  description: string;
  isRunning: boolean;
}

export class Timer {
  private state: TimerState = {
    startTime: null,
    description: '',
    isRunning: false
  };

  start(description: string = 'Timer'): void {
    if (this.state.isRunning) {
      console.log(chalk.yellow('⚠️  Timer is already running. Stop it first with /timer stop'));
      return;
    }

    this.state = {
      startTime: new Date(),
      description,
      isRunning: true
    };

    console.log(chalk.green(`⏰ Timer started: ${description}`));
    console.log(chalk.gray(`   Started at: ${this.state.startTime?.toLocaleTimeString()}`));
  }

  stop(): string | null {
    if (!this.state.isRunning || !this.state.startTime) {
      console.log(chalk.yellow('⚠️  No timer is currently running'));
      return null;
    }

    const endTime = new Date();
    const duration = endTime.getTime() - this.state.startTime.getTime();
    const durationString = this.formatDuration(duration);

    console.log(chalk.red(`⏹️  Timer stopped: ${this.state.description}`));
    console.log(chalk.gray(`   Started: ${this.state.startTime.toLocaleTimeString()}`));
    console.log(chalk.gray(`   Ended:   ${endTime.toLocaleTimeString()}`));
    console.log(chalk.cyan(`   Duration: ${durationString}`));

    // Reset state
    const result = `${this.state.description}: ${durationString}`;
    this.state = {
      startTime: null,
      description: '',
      isRunning: false
    };

    return result;
  }

  status(): void {
    if (!this.state.isRunning || !this.state.startTime) {
      console.log(chalk.gray('⏱️  No timer currently running'));
      return;
    }

    const currentTime = new Date();
    const elapsed = currentTime.getTime() - this.state.startTime.getTime();
    const elapsedString = this.formatDuration(elapsed);

    console.log(chalk.blue(`⏱️  Timer running: ${this.state.description}`));
    console.log(chalk.gray(`   Started: ${this.state.startTime.toLocaleTimeString()}`));
    console.log(chalk.cyan(`   Elapsed: ${elapsedString}`));
  }

  private formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${remainingMinutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  getState(): TimerState {
    return { ...this.state };
  }
}

// Global timer instance
export const globalTimer = new Timer();