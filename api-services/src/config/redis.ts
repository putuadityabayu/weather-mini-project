/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import { createClient, RedisClientType } from 'redis';
import { config } from './index';
import logger from '@src/utils/logger';

let redisClient: RedisClientType;

export const connectRedis = async () => {
    console.log(`redis://${config.redisHost}:${config.redisPort}`)
    redisClient = createClient({
        url: `redis://${config.redisHost}:${config.redisPort}`,
    });

    redisClient.on('error', (err) => logger.error('Redis Client Error', err));
    redisClient.on('connect', () => logger.info('Connected to Redis'));

    try {
        await redisClient.connect();
        logger.info('Redis connection established');
    } catch (error) {
        logger.error('Failed to connect to Redis', error);
        process.exit(1);
    }
};

export const getRedisClient = (): RedisClientType => {
    if (!redisClient || !redisClient.isReady) {
        logger.error('Redis client is not initialized or connected.');
        throw new Error('Redis client not available.');
    }
    return redisClient;
};

export const disconnectRedis = async () => {
    if (redisClient && redisClient.isReady) {
        await redisClient.quit();
        logger.info('Disconnected from Redis');
    }
};