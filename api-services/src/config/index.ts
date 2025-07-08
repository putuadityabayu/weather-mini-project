/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export const config = {
    port: 3000,
    mongodbUri: process.env.API_SERVICE_MONGODB_URI || 'mongodb://mongodb:27017/weather_app',
    redisHost: process.env.REDIS_HOST || 'redis',
    redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://rabbitmq',
    openWeatherApiKey: process.env.API_SERVICE_OPENWEATHER_API_KEY || '',
    openWeatherApiBaseUrl: process.env.API_SERVICE_OPENWEATHER_API_BASE_URL || 'https://api.openweathermap.org/data/2.5/weather',
};

// Pastikan kunci API ada
if (!config.openWeatherApiKey) {
    console.error('OPENWEATHER_API_KEY is not set. Please add it to your .env file.');
    throw new Error('OPENWEATHER_API_KEY is not set.');
}