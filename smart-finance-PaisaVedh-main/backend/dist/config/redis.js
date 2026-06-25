"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = exports.redisClient = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class MockRedisClient {
    store = new Map();
    isConnectedFlag = false;
    async connect() {
        this.isConnectedFlag = true;
        logger_1.default.info('Mock Redis connected (in-memory storage)');
    }
    async disconnect() {
        this.isConnectedFlag = false;
        this.store.clear();
        logger_1.default.info('Mock Redis disconnected');
    }
    async get(key) {
        const item = this.store.get(key);
        if (!item)
            return null;
        if (item.expiry && Date.now() > item.expiry) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value, ttl) {
        this.store.set(key, {
            value,
            expiry: ttl ? Date.now() + ttl * 1000 : undefined,
        });
    }
    async del(key) {
        this.store.delete(key);
    }
    async exists(key) {
        return this.store.has(key);
    }
    async increment(key) {
        const current = (await this.get(key)) || 0;
        const newValue = current + 1;
        await this.set(key, newValue);
        return newValue;
    }
    isReady() {
        return this.isConnectedFlag;
    }
}
exports.redisClient = new MockRedisClient();
// ✅ Add CacheService class here
class CacheService {
    async get(key) {
        try {
            return await exports.redisClient.get(key);
        }
        catch (error) {
            logger_1.default.error('Cache get error:', error);
            return null;
        }
    }
    async set(key, value, ttl = 3600) {
        try {
            await exports.redisClient.set(key, value, ttl);
        }
        catch (error) {
            logger_1.default.error('Cache set error:', error);
        }
    }
    async del(key) {
        try {
            await exports.redisClient.del(key);
        }
        catch (error) {
            logger_1.default.error('Cache del error:', error);
        }
    }
    async exists(key) {
        try {
            return await exports.redisClient.exists(key);
        }
        catch (error) {
            logger_1.default.error('Cache exists error:', error);
            return false;
        }
    }
    async increment(key) {
        try {
            return await exports.redisClient.increment(key);
        }
        catch (error) {
            logger_1.default.error('Cache increment error:', error);
            return 0;
        }
    }
    async flushPattern(pattern) {
        logger_1.default.info(`Flush pattern called: ${pattern}`);
    }
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
// ✅ Create and export cacheService instance
exports.cacheService = new CacheService();
//# sourceMappingURL=redis.js.map