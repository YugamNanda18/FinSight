import logger from '../utils/logger';

class MockRedisClient {
  private store: Map<string, { value: any; expiry?: number }> = new Map();
  private isConnectedFlag = false;

  async connect(): Promise<void> {
    this.isConnectedFlag = true;
    logger.info('Mock Redis connected (in-memory storage)');
  }

  async disconnect(): Promise<void> {
    this.isConnectedFlag = false;
    this.store.clear();
    logger.info('Mock Redis disconnected');
  }

  async get(key: string): Promise<any> {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiry: ttl ? Date.now() + ttl * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async increment(key: string): Promise<number> {
    const current = (await this.get(key)) || 0;
    const newValue = current + 1;
    await this.set(key, newValue);
    return newValue;
  }

  isReady(): boolean {
    return this.isConnectedFlag;
  }
}

export const redisClient = new MockRedisClient();

// ✅ Add CacheService class here
export class CacheService {
  async get(key: string): Promise<any> {
    try {
      return await redisClient.get(key);
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await redisClient.set(key, value, ttl);
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }
  
  async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error('Cache del error:', error);
    }
  }
  
  async exists(key: string): Promise<boolean> {
    try {
      return await redisClient.exists(key);
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }
  
  async increment(key: string): Promise<number> {
    try {
      return await redisClient.increment(key);
    } catch (error) {
      logger.error('Cache increment error:', error);
      return 0;
    }
  }
  
  async flushPattern(pattern: string): Promise<void> {
    logger.info(`Flush pattern called: ${pattern}`);
  }
  
  async remember<T>(
    key: string,
    ttl: number,
    callback: () => Promise<T>
  ): Promise<T> {
    const cached = await this.get(key);
    if (cached) {
      return cached as T;
    }
    
    const result = await callback();
    await this.set(key, result, ttl);
    return result;
  }
}

// ✅ Create and export cacheService instance
export const cacheService = new CacheService();