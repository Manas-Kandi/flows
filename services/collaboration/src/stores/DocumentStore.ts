import Redis from 'ioredis';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';

export class DocumentStore {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on('error', (error) => {
      logger.error({ error }, 'Redis connection error');
    });

    this.redis.on('connect', () => {
      logger.info('Connected to Redis');
    });
  }

  async loadDocument(projectId: string): Promise<Uint8Array | null> {
    try {
      const key = `document:${projectId}`;
      const data = await this.redis.getBuffer(key);
      
      if (!data) return null;
      
      return new Uint8Array(data);
    } catch (error) {
      logger.error({ error, projectId }, 'Error loading document');
      return null;
    }
  }

  async saveUpdate(projectId: string, update: Uint8Array): Promise<void> {
    try {
      const key = `document:${projectId}`;
      const updateKey = `updates:${projectId}`;
      
      // Append update to list
      await this.redis.rpush(updateKey, Buffer.from(update));
      
      // Keep only last 1000 updates
      await this.redis.ltrim(updateKey, -1000, -1);
      
      // Store latest state (debounced in production)
      await this.redis.set(key, Buffer.from(update), 'EX', 86400); // 24 hour TTL
    } catch (error) {
      logger.error({ error, projectId }, 'Error saving update');
    }
  }

  async getUpdates(projectId: string, from: number = 0): Promise<Uint8Array[]> {
    try {
      const updateKey = `updates:${projectId}`;
      const updates = await this.redis.lrange(updateKey, from, -1);
      
      return updates.map((update) => new Uint8Array(Buffer.from(update)));
    } catch (error) {
      logger.error({ error, projectId }, 'Error getting updates');
      return [];
    }
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}
