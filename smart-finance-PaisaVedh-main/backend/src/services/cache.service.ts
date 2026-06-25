import { redisClient } from '../config/redis';

export class CacheService {
  async get(key: string): Promise<any> {
    return await redisClient.get(key);
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await redisClient.set(key, value, ttl);
  }
  
  async del(key: string): Promise<void> {
    await redisClient.del(key);
  }
  
  async exists(key: string): Promise<boolean> {
    return await redisClient.exists(key);
  }
  
  async increment(key: string): Promise<number> {
    return await redisClient.increment(key);
  }
  
  async flushPattern(pattern: string): Promise<void> {
    // In production, implement pattern-based deletion
    // This is a simplified version
    await redisClient.del(pattern);
  }
  
  // Cache wrapper for expensive operations
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

export const cacheService = new CacheService();