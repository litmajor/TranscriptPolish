
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

interface CollaborationSession {
  transcriptId: string;
  users: Map<string, { ws: WebSocket; userId: string; name: string; cursor: number }>;
  currentContent: string;
  operations: Array<{
    id: string;
    userId: string;
    type: 'insert' | 'delete' | 'cursor';
    position: number;
    content?: string;
    timestamp: Date;
  }>;
}

export class CollaborationService {
  private sessions = new Map<string, CollaborationSession>();
  private wss: WebSocketServer;

  constructor(server: any) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocketHandlers();
  }

  private setupWebSocketHandlers() {
    this.wss.on('connection', (ws: WebSocket, request) => {
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.removeUserFromAllSessions(ws);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: any) {
    switch (message.type) {
      case 'join':
        this.joinSession(ws, message.transcriptId, message.userId, message.userName);
        break;
      case 'edit':
        this.handleEdit(ws, message);
        break;
      case 'cursor':
        this.handleCursor(ws, message);
        break;
      case 'leave':
        this.leaveSession(ws, message.transcriptId);
        break;
    }
  }

  private joinSession(ws: WebSocket, transcriptId: string, userId: string, userName: string) {
    if (!this.sessions.has(transcriptId)) {
      this.sessions.set(transcriptId, {
        transcriptId,
        users: new Map(),
        currentContent: '',
        operations: []
      });
    }

    const session = this.sessions.get(transcriptId)!;
    session.users.set(userId, { ws, userId, name: userName, cursor: 0 });

    // Send current state to new user
    ws.send(JSON.stringify({
      type: 'init',
      content: session.currentContent,
      users: Array.from(session.users.values()).map(u => ({
        userId: u.userId,
        name: u.name,
        cursor: u.cursor
      }))
    }));

    // Notify other users
    this.broadcastToSession(transcriptId, {
      type: 'user_joined',
      userId,
      userName
    }, userId);
  }

  private handleEdit(ws: WebSocket, message: any) {
    const session = this.sessions.get(message.transcriptId);
    if (!session) return;

    const operation = {
      id: Math.random().toString(36),
      userId: message.userId,
      type: message.operation.type,
      position: message.operation.position,
      content: message.operation.content,
      timestamp: new Date()
    };

    session.operations.push(operation);
    
    // Apply operation to current content
    if (operation.type === 'insert') {
      session.currentContent = 
        session.currentContent.slice(0, operation.position) +
        operation.content +
        session.currentContent.slice(operation.position);
    } else if (operation.type === 'delete') {
      session.currentContent = 
        session.currentContent.slice(0, operation.position) +
        session.currentContent.slice(operation.position + (operation.content?.length || 1));
    }

    // Broadcast to all users except sender
    this.broadcastToSession(message.transcriptId, {
      type: 'operation',
      operation
    }, message.userId);
  }

  private handleCursor(ws: WebSocket, message: any) {
    const session = this.sessions.get(message.transcriptId);
    if (!session) return;

    const user = session.users.get(message.userId);
    if (user) {
      user.cursor = message.position;
      
      this.broadcastToSession(message.transcriptId, {
        type: 'cursor_update',
        userId: message.userId,
        position: message.position
      }, message.userId);
    }
  }

  private broadcastToSession(transcriptId: string, message: any, excludeUserId?: string) {
    const session = this.sessions.get(transcriptId);
    if (!session) return;

    session.users.forEach((user, userId) => {
      if (userId !== excludeUserId && user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(JSON.stringify(message));
      }
    });
  }

  private removeUserFromAllSessions(ws: WebSocket) {
    this.sessions.forEach((session, transcriptId) => {
      session.users.forEach((user, userId) => {
        if (user.ws === ws) {
          session.users.delete(userId);
          this.broadcastToSession(transcriptId, {
            type: 'user_left',
            userId
          });
        }
      });
    });
  }

  private leaveSession(ws: WebSocket, transcriptId: string) {
    const session = this.sessions.get(transcriptId);
    if (!session) return;

    session.users.forEach((user, userId) => {
      if (user.ws === ws) {
        session.users.delete(userId);
        this.broadcastToSession(transcriptId, {
          type: 'user_left',
          userId
        });
      }
    });
  }
}
