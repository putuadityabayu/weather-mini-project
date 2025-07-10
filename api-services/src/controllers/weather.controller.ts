/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import { Request, Response, NextFunction } from 'express';
import { WeatherService } from '../services/weather.service';
import logger from '@src/utils/logger';

export class WeatherController {
    private weatherService: WeatherService;

    constructor(weatherService: WeatherService = new WeatherService()) {
        this.weatherService = weatherService;
    }

    async getWeatherByLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
        const { location, refresh } = req.query;

        if (!location || typeof location !== 'string') {
            res.status(400).json({ success: false, error: 'Location query parameter is required.' });
            return;
        }

        const forceRefresh = refresh === 'true';

        try {
            const weatherData = await this.weatherService.getWeatherData(location as string, forceRefresh);

            if (weatherData) {
                res.status(200).json({ data: weatherData, success: true });
            } else {
                res.status(404).json({ success: false, error: 'Weather data for the specified location not found.' });
            }
        } catch (error) {
            logger.error(`Error in getWeatherByLocation for ${location}:`, error);
            next(error);
        }
    }
}