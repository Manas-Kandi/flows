import { WebSocket, WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { nanoid } from 'nanoid';
import { logger } from '../lib/logger.js';
import { PresenceManager } from './PresenceManager.js';
import { DocumentStore } from '../stores/DocumentStore.js';

interface Connection {
  ws: WebSocket;
  userId: string;
  projectId: string;
  doc: Y.Doc;
  isAlive: boolean;
}

export class CollaborationManager {
  private connections: Map<string, Connection> = new Map();
  private documents: Map<string, Y.Doc> = new Map();
  private presenceManager: PresenceManager;
  private documentStore: DocumentStore;

  constructor(private wss: WebSocketServer) {
    this.presenceManager = new PresenceManager();
    this.documentStore = new DocumentStore();
    this.startHeartbeat();
  }

  handleConnection(ws: WebSocket, projectId: string, userId: string) {
    const connectionId = nanoid();
    
    // Get or create shared document
    let doc = this.documents.get(projectId);
    if (!doc) {
      doc = new Y.Doc();
      this.documents.set(projectId, doc);
      
      // Load document from persistent storage
      this.documentStore.loadDocument(projectId).then((data) => {
        if (data && doc) {
          Y.applyUpdate(doc, data);
        }
      });
    }

    const connection: Connection = {
      ws,
      userId,
      projectId,
      doc,
      isAlive: true,
    };

    this.connections.set(connectionId, connection);

    // Add user to presence
    this.presenceManager.addUser(projectId, userId);
    this.broadcastPresence(projectId);

    // Setup message handlers
    ws.on('message', (data: Buffer) => {
      this.handleMessage(connectionId, data);
    });

    ws.on('pong', () => {
      connection.isAlive = true;
    });

    ws.on('close', () => {
      this.handleDisconnection(connectionId);
    });

    ws.on('error', (error) => {
      logger.error({ error, connectionId }, 'WebSocket error');
    });

    // Send initial sync
    this.sendInitialSync(connectionId);

    logger.info({ connectionId, projectId, userId }, 'Connection established');
  }

  private handleMessage(connectionId: string, data: Buffer) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'update':
          this.handleUpdate(connection, message.update);
          break;
        case 'presence':
          this.handlePresenceUpdate(connection, message.data);
          break;
        case 'cursor':
          this.handleCursorUpdate(connection, message.data);
          break;
        case 'comment':
          this.handleComment(connection, message.data);
          break;
        default:
          logger.warn({ type: message.type }, 'Unknown message type');
      }
    } catch (error) {
      logger.error({ error, connectionId }, 'Error handling message');
    }
  }

  private handleUpdate(connection: Connection, update: Uint8Array) {
    const { doc, projectId } = connection;

    // Apply update to document
    Y.applyUpdate(doc, new Uint8Array(update));

    // Persist update
    this.documentStore.saveUpdate(projectId, new Uint8Array(update));

    // Broadcast to other connections
    this.broadcast(projectId, connection, {
      type: 'update',
      update: Array.from(update),
    });
  }

  private handlePresenceUpdate(connection: Connection, data: any) {
    this.presenceManager.updateUser(connection.projectId, connection.userId, data);
    this.broadcastPresence(connection.projectId);
  }

  private handleCursorUpdate(connection: Connection, data: any) {
    this.broadcast(connection.projectId, connection, {
      type: 'cursor',
      userId: connection.userId,
      data,
    });
  }

  private handleComment(connection: Connection, data: any) {
    // TODO: Persist comment to database
    this.broadcast(connection.projectId, connection, {
      type: 'comment',
      userId: connection.userId,
      data,
    });
  }

  private handleDisconnection(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { projectId, userId } = connection;

    this.presenceManager.removeUser(projectId, userId);
    this.broadcastPresence(projectId);
    this.connections.delete(connectionId);

    logger.info({ connectionId, projectId, userId }, 'Connection closed');
  }

  private sendInitialSync(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { ws, doc, projectId } = connection;

    // Send document state
    const state = Y.encodeStateAsUpdate(doc);
    this.send(ws, {
      type: 'sync',
      state: Array.from(state),
    });

    // Send presence
    const presence = this.presenceManager.getPresence(projectId);
    this.send(ws, {
      type: 'presence',
      users: presence,
    });
  }

  private broadcast(projectId: string, exclude: Connection | null, message: any) {
    const payload = JSON.stringify(message);

    this.connections.forEach((connection) => {
      if (connection.projectId === projectId && connection !== exclude) {
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.send(payload);
        }
      }
    });
  }

  private broadcastPresence(projectId: string) {
    const presence = this.presenceManager.getPresence(projectId);
    this.broadcast(projectId, null, {
      type: 'presence',
      users: presence,
    });
  }

  private send(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private startHeartbeat() {
    setInterval(() => {
      this.connections.forEach((connection, connectionId) => {
        if (!connection.isAlive) {
          logger.info({ connectionId }, 'Terminating inactive connection');
          connection.ws.terminate();
          return;
        }

        connection.isAlive = false;
        connection.ws.ping();
      });
    }, 30000); // 30 seconds
  }
}
