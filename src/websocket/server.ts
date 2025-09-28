import { Server } from 'socket.io';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';

interface Session {
  id: string;
  consoleSocket?: string;
  mobileSocket?: string;
  currentAgent: 'scout' | 'analyst' | 'mentor' | 'scoring';
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    agentType: 'scout' | 'analyst' | 'mentor' | 'scoring';
  }>;
}

class WebSocketServer {
  private io: Server;
  private sessions: Map<string, Session> = new Map();
  private socketToSession: Map<string, string> = new Map();

  constructor(port: number = 3001) {
    const httpServer = createServer();
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();

    httpServer.listen(port, () => {
      console.log(`🔌 WebSocket server running on port ${port}`);
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`📱 Client connected: ${socket.id}`);

      // Create new session (from console)
      socket.on('create-session', (callback) => {
        const sessionId = uuidv4().substring(0, 8).toUpperCase();
        const session: Session = {
          id: sessionId,
          consoleSocket: socket.id,
          currentAgent: 'scout',
          messages: []
        };

        this.sessions.set(sessionId, session);
        this.socketToSession.set(socket.id, sessionId);

        console.log(`🆕 Session created: ${sessionId}`);
        callback({ sessionId });
      });

      // Join existing session (from mobile)
      socket.on('join-session', ({ sessionId }) => {
        const session = this.sessions.get(sessionId);
        if (session) {
          session.mobileSocket = socket.id;
          this.socketToSession.set(socket.id, sessionId);

          // Notify mobile app of successful pairing
          socket.emit('session-paired', { sessionId });

          // Notify console of mobile connection
          if (session.consoleSocket) {
            this.io.to(session.consoleSocket).emit('mobile-connected', { sessionId });
          }

          // Send current state to mobile
          socket.emit('agent-switched', { agentType: session.currentAgent });
          socket.emit('message-history', { messages: session.messages });

          console.log(`📱 Mobile joined session: ${sessionId}`);
        } else {
          socket.emit('error', { message: 'Session not found' });
        }
      });

      // Switch agent
      socket.on('switch-agent', ({ sessionId, agentType }) => {
        const session = this.sessions.get(sessionId);
        if (session) {
          session.currentAgent = agentType;

          // Broadcast to both console and mobile
          if (session.consoleSocket) {
            this.io.to(session.consoleSocket).emit('agent-switched', { agentType });
          }
          if (session.mobileSocket) {
            this.io.to(session.mobileSocket).emit('agent-switched', { agentType });
          }

          console.log(`🔄 Agent switched to ${agentType} in session ${sessionId}`);
        }
      });

      // Send message
      socket.on('send-message', ({ sessionId, message }) => {
        const session = this.sessions.get(sessionId);
        if (session) {
          const fullMessage = {
            id: uuidv4(),
            timestamp: new Date(),
            ...message
          };

          session.messages.push(fullMessage);

          // Broadcast to both console and mobile
          if (session.consoleSocket) {
            this.io.to(session.consoleSocket).emit('new-message', fullMessage);
          }
          if (session.mobileSocket) {
            this.io.to(session.mobileSocket).emit('new-message', fullMessage);
          }

          console.log(`💬 Message sent in session ${sessionId}: ${message.content.substring(0, 50)}...`);
        }
      });

      // Search status updates
      socket.on('search-started', ({ sessionId }) => {
        const session = this.sessions.get(sessionId);
        if (session && session.mobileSocket) {
          this.io.to(session.mobileSocket).emit('search-started');
        }
      });

      socket.on('search-completed', ({ sessionId }) => {
        const session = this.sessions.get(sessionId);
        if (session && session.mobileSocket) {
          this.io.to(session.mobileSocket).emit('search-completed');
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const sessionId = this.socketToSession.get(socket.id);
        if (sessionId) {
          const session = this.sessions.get(sessionId);
          if (session) {
            // Remove socket reference
            if (session.consoleSocket === socket.id) {
              session.consoleSocket = undefined;
              console.log(`💻 Console disconnected from session ${sessionId}`);

              // Notify mobile of console disconnection
              if (session.mobileSocket) {
                this.io.to(session.mobileSocket).emit('console-disconnected');
              }
            } else if (session.mobileSocket === socket.id) {
              session.mobileSocket = undefined;
              console.log(`📱 Mobile disconnected from session ${sessionId}`);

              // Notify console of mobile disconnection
              if (session.consoleSocket) {
                this.io.to(session.consoleSocket).emit('mobile-disconnected');
              }
            }

            // Clean up session if both disconnected
            if (!session.consoleSocket && !session.mobileSocket) {
              this.sessions.delete(sessionId);
              console.log(`🗑️  Session ${sessionId} cleaned up`);
            }
          }

          this.socketToSession.delete(socket.id);
        }

        console.log(`👋 Client disconnected: ${socket.id}`);
      });
    });
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  getSessions(): Session[] {
    return Array.from(this.sessions.values());
  }
}

// Export singleton instance
export const webSocketServer = new WebSocketServer();
export default webSocketServer;