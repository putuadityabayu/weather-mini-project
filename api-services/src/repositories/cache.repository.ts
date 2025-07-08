/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import { RedisClientType } from 'redis';
import { getRedisClient } from '@src/config/redis';
import logger from '@src/utils/logger';
import { IWeather } from '@src/interfaces/weather.interface';

const CACHE_TTL_SECONDS = 300; // 5 menit

export class CacheRepository {
    private redisClient: RedisClientType;

    constructor() {
        this.redisClient = getRedisClient();
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await this.redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error(`Error getting data from cache for key ${key}:`, error);
            throw error;
        }
    }

    async set(key: string, data: object, ttlSeconds: number = CACHE_TTL_SECONDS): Promise<void> {
        try {
            await this.redisClient.set(key, JSON.stringify(data), {
                EX: ttlSeconds,
            });
        } catch (error) {
            logger.error(`Error setting data to cache for key ${key}:`, error);
            throw error
        }
    }

    async invalidate(key: string): Promise<void> {
        try {
            await this.redisClient.del(key);
            logger.debug(`Cache invalidated for key: ${key}`);
        } catch (error) {
            logger.error(`Error invalidating cache for key ${key}:`, error);
            throw error
        }
    }
}