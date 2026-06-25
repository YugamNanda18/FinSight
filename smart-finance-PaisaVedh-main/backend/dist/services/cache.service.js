"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
const redis_1 = require("../config/redis");
class CacheService {
    async get(key) {
        return await redis_1.redisClient.get(key);
    }
    async set(key, value, ttl = 3600) {
        await redis_1.redisClient.set(key, value, ttl);
    }
    async del(key) {
        await redis_1.redisClient.del(key);
    }
    async exists(key) {
        return await redis_1.redisClient.exists(key);
    }
    async increment(key) {
        return await redis_1.redisClient.increment(key);
    }
    async flushPattern(pattern) {
        // In production, implement pattern-based deletion
        // This is a simplified version
        await redis_1.redisClient.del(pattern);
    }
    // Cache wrapper for expensive operations
    async remember(key, ttl, callback) {
        const cached = await this.get(key);
        if (cached) {
            return cached;
        }
        const result = await callback();
        await this.set(key, result, ttl);
        return result;
    }
}
exports.CacheService = CacheService;
exports.cacheService = new CacheService();
//# sourceMappingURL=cache.service.js.map