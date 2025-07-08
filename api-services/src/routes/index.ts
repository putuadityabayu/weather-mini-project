/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import { Router } from 'express';
import { WeatherController } from '../controllers/weather.controller';
import { WeatherService } from '../services/weather.service';
import { WeatherRepository } from '../repositories/weather.repository';
import { CacheRepository } from '../repositories/cache.repository';
import { weatherRoutes } from './weather.route';

export const registerAllRoutes = (appRouter: Router) => {
    const weatherRepository = new WeatherRepository();
    const cacheRepository = new CacheRepository();

    const weatherService = new WeatherService(weatherRepository, cacheRepository);

    const weatherController = new WeatherController(weatherService);

    appRouter.use('/weather', weatherRoutes(weatherController));

    console.log('All routes registered successfully.');
};