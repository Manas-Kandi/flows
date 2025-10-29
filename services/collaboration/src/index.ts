import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { logger } from './lib/logger.js';
import { CollaborationManager } from './managers/CollaborationManager.js';
import { setupRoutes } from './routes/index.js';
import { config } from './config.js';

const app = express();
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
}));
app.use(compression());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'collaboration', timestamp: new Date().toISOString() });
});

// API routes
setupRoutes(app);

// WebSocket server for real-time collaboration
const wss = new WebSocketServer({ 
  server,
  path: '/ws',
});

const collaborationManager = new CollaborationManager(wss);

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const projectId = url.searchParams.get('projectId');
  const userId = url.searchParams.get('userId');

  if (!projectId || !userId) {
    logger.warn('Connection rejected: missing projectId or userId');
    ws.close(1008, 'Missing projectId or userId');
    return;
  }

  logger.info({ projectId, userId }, 'New collaboration connection');
  collaborationManager.handleConnection(ws, projectId, userId);
});

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(config.port, () => {
  logger.info({ port: config.port }, 'Collaboration service started');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
