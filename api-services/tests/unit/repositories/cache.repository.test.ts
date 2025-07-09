/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import { CacheRepository } from '@src/repositories/cache.repository';
import { getRedisClient } from '@src/config/redis';

// Mock Redis client methods
const mockSet = jest.fn();
const mockGet = jest.fn();
const mockDel = jest.fn();

// Mock getRedisClient to return a mocked redis client object
jest.mock('@src/config/redis', () => ({
    getRedisClient: jest.fn(() => ({
        set: mockSet,
        get: mockGet,
        del: mockDel,
    })),
}));

describe('CacheRepository', () => {
    let cacheRepository: CacheRepository;

    beforeEach(() => {
        jest.clearAllMocks();
        cacheRepository = new CacheRepository();
    });

    // Test set method
    describe('set', () => {
        it('should set data in Redis with a TTL', async () => {
            const key = 'testKey';
            const value = { data: 'testData' };
            const ttl = 3600; // 1 hour
            mockSet.mockResolvedValue('OK');

            await cacheRepository.set(key, value, ttl);

            expect(getRedisClient).toHaveBeenCalled();
            expect(mockSet).toHaveBeenCalledWith(key, JSON.stringify(value), { EX: ttl });
        });

        it('should throw an error if Redis set operation fails', async () => {
            const mockError = new Error('Redis set error');
            mockSet.mockRejectedValue(mockError);

            await expect(cacheRepository.set('key', { data: 'value' }, 60)).rejects.toThrow('Redis set error');
            expect(getRedisClient).toHaveBeenCalled();
        });
    });

    // Test get method
    describe('get', () => {
        it('should return parsed data if key exists in Redis', async () => {
            const key = 'existingKey';
            const mockValue = { data: 'cachedData' };
            mockGet.mockResolvedValue(JSON.stringify(mockValue));

            const result = await cacheRepository.get(key);

            expect(getRedisClient).toHaveBeenCalled();
            expect(mockGet).toHaveBeenCalledWith(key);
            expect(result).toEqual(mockValue);
        });

        it('should return null if key does not exist in Redis', async () => {
            const key = 'nonExistingKey';
            mockGet.mockResolvedValue(null);

            const result = await cacheRepository.get(key);

            expect(getRedisClient).toHaveBeenCalled();
            expect(mockGet).toHaveBeenCalledWith(key);
            expect(result).toBeNull();
        });

        it('should throw an error if Redis get operation fails', async () => {
            const mockError = new Error('Redis get error');
            mockGet.mockRejectedValue(mockError);

            await expect(cacheRepository.get('key')).rejects.toThrow('Redis get error');
            expect(getRedisClient).toHaveBeenCalled();
        });
    });

    // Test invalidate method
    describe('invalidate', () => {
        it('should delete a key from Redis', async () => {
            const key = 'keyToDelete';
            mockDel.mockResolvedValue(1); // 1 indicates one key was deleted

            await cacheRepository.invalidate(key);

            expect(getRedisClient).toHaveBeenCalled();
            expect(mockDel).toHaveBeenCalledWith(key);
        });

        it('should throw an error if Redis del operation fails', async () => {
            const mockError = new Error('Redis del error');
            mockDel.mockRejectedValue(mockError);

            await expect(cacheRepository.invalidate('key')).rejects.toThrow('Redis del error');
            expect(getRedisClient).toHaveBeenCalled();
        });
    });
});