/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import axios from 'axios';
import { WeatherRepository } from '@src/repositories/weather.repository';
import { CacheRepository } from '@src/repositories/cache.repository';
import { IWeather } from '@src/interfaces/weather.interface';
import { config } from '@src/config/index';
import { publishToQueue } from '../config/rabbitmq';
import logger from '@src/utils/logger';

export class WeatherService {
    private weatherRepository: WeatherRepository;
    private cacheRepository: CacheRepository;

    constructor(
        weatherRepository: WeatherRepository = new WeatherRepository(),
        cacheRepository: CacheRepository = new CacheRepository()
    ) {
        this.weatherRepository = weatherRepository;
        this.cacheRepository = cacheRepository;
    }

    private async fetchWeatherFromExternalApi(location: string): Promise<IWeather | null> {
        try {
            const response = await axios.get(config.openWeatherApiBaseUrl, {
                params: {
                    q: location,
                    appid: config.openWeatherApiKey,
                    units: 'metric',
                },
            });

            const data = response.data;
            return {
                location: data.name,
                temperature: data.main.temp,
                description: data.weather[0].description,
                humidity: data.main.humidity,
                windSpeed: data.wind.speed,
                timestamp: new Date(),
                source: 'external',
            };
        } catch (error: any) {
            logger.error(`Error fetching weather from external API for ${location}:`, error);
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return null; // Location not found
            }
            throw new Error('Failed to fetch weather data from external source.');
        }
    }

    async getWeatherData(location: string, forceRefresh: boolean = false): Promise<IWeather | null> {
        const cacheKey = `weather:${location.toLowerCase()}`;

        // 1. Check Redis Cache
        if (!forceRefresh) {
            const cachedData = await this.cacheRepository.get<IWeather>(cacheKey);
            if (cachedData) {
                logger.info(`Serving weather data for ${location} from cache.`);
                return { ...cachedData, source: 'cache' };
            }
        } else {
            // Invalidate cache on explicit refresh
            await this.cacheRepository.invalidate(cacheKey);
            logger.info(`Forcing refresh, invalidating cache for ${location}`);
            // Publish message to RabbitMQ for notification on refresh
            await publishToQueue('weather_refresh_events', { location: location, timestamp: new Date().toISOString() });
        }

        // 2. Fetch from MongoDB (if not in cache or forced refresh)
        const dbData = await this.weatherRepository.findByLocation(location);
        if (dbData && !forceRefresh) { // If found in DB and not forced refresh
            logger.info(`Serving weather data for ${location} from MongoDB (cache miss).`);
            // re-cache data from DB if it wasn't in Redis
            await this.cacheRepository.set(cacheKey, dbData);
            return { ...dbData, source: 'external' }; // Data was originally from external source via DB
        }

        // 3. Fetch from External API
        logger.info(`Fetching weather data for ${location} from external API.`);
        const weatherData = await this.fetchWeatherFromExternalApi(location);

        if (weatherData) {
            // 4. Save to MongoDB
            await this.weatherRepository.upsert(location, weatherData);
            logger.info(`Saved weather data for ${location} to MongoDB.`);

            // 5. Cache in Redis
            await this.cacheRepository.set(cacheKey, weatherData);
            logger.info(`Cached weather data for ${location} in Redis.`);
        }

        return weatherData;
    }
}