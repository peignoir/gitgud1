import { io, Socket } from 'socket.io-client';
import qrcode from 'qrcode-terminal';
import chalk from 'chalk';

interface WebSocketClientOptions {
  serverUrl?: string;
  onMobileConnected?: () => void;
  onMobileDisconnected?: () => void;
  onAgentSwitched?: (agentType: 'scout' | 'analyst' | 'mentor' | 'scoring') => void;
  onNewMessage?: (message: any) => void;
}

export class WebSocketClient {
  private socket: Socket | null = null;
  private sessionId: string | null = null;
  private mobileConnected: boolean = false;
  private options: WebSocketClientOptions;

  constructor(options: WebSocketClientOptions = {}) {
    this.options = {
      serverUrl: 'ws://localhost:3001',
      ...options
    };
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.options.serverUrl!);

      this.socket.on('connect', () => {
        console.log(chalk.green('🔌 Connected to WebSocket server'));
        this.createSession(resolve, reject);
      });

      this.socket.on('connect_error', (error) => {
        console.log(chalk.red('❌ Failed to connect to WebSocket server'));
        reject(error);
      });

      this.setupEventHandlers();
    });
  }

  private createSession(resolve: () => void, reject: (error: any) => void): void {
    if (!this.socket) return;

    this.socket.emit('create-session', (response: { sessionId: string }) => {
      this.sessionId = response.sessionId;
      console.log(chalk.cyan(`\\n📱 Mobile Session Created: ${this.sessionId}`));
      this.displayQRCode();
      resolve();
    });
  }

  private displayQRCode(): void {
    if (!this.sessionId) return;

    const mobileUrl = `http://localhost:3000?session=${this.sessionId}`;

    console.log(chalk.cyan('\\n🔗 Mobile App Connection:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white('Scan this QR code with your mobile device:'));
    console.log('');

    // Generate QR code in terminal
    qrcode.generate(mobileUrl, { small: true }, (qr) => {
      console.log(qr);
    });

    console.log('');
    console.log(chalk.blue('Or manually visit:'));
    console.log(chalk.cyan(mobileUrl));
    console.log(chalk.gray('─'.repeat(50)));
    console.log('');
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('mobile-connected', ({ sessionId }) => {
      this.mobileConnected = true;
      console.log(chalk.green(`\\n📱 Mobile device connected to session ${sessionId}`));
      console.log(chalk.white('You can now use both console and mobile app!'));
      console.log('');
      this.options.onMobileConnected?.();
    });

    this.socket.on('mobile-disconnected', () => {
      this.mobileConnected = false;
      console.log(chalk.yellow('\\n📱 Mobile device disconnected'));
      this.options.onMobileDisconnected?.();
    });

    this.socket.on('agent-switched', ({ agentType }) => {
      console.log(chalk.blue(`\\n🔄 Mobile switched to ${agentType} agent`));
      this.options.onAgentSwitched?.(agentType);
    });

    this.socket.on('new-message', (message) => {
      if (message.role === 'user') {
        console.log(chalk.magenta(`\\n📱 Mobile: ${message.content}`));
      }
      this.options.onNewMessage?.(message);
    });

    this.socket.on('disconnect', () => {
      console.log(chalk.yellow('🔌 WebSocket disconnected'));
      this.mobileConnected = false;
    });
  }

  sendMessage(message: any): void {
    if (this.socket && this.sessionId) {
      this.socket.emit('send-message', { sessionId: this.sessionId, message });
    }
  }

  switchAgent(agentType: 'scout' | 'analyst' | 'mentor' | 'scoring'): void {
    if (this.socket && this.sessionId) {
      this.socket.emit('switch-agent', { sessionId: this.sessionId, agentType });
    }
  }

  notifySearchStarted(): void {
    if (this.socket && this.sessionId) {
      this.socket.emit('search-started', { sessionId: this.sessionId });
    }
  }

  notifySearchCompleted(): void {
    if (this.socket && this.sessionId) {
      this.socket.emit('search-completed', { sessionId: this.sessionId });
    }
  }

  isMobileConnected(): boolean {
    return this.mobileConnected;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.sessionId = null;
      this.mobileConnected = false;
    }
  }
}