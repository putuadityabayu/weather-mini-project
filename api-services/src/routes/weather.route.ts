/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import { Router } from 'express';
import { WeatherController } from '../controllers/weather.controller';

export const weatherRoutes = (weatherController: WeatherController): Router => {
    const router = Router();

    // GET /weather?location=London&refresh=true
    // Bind the controller method to its instance for correct 'this' context
    router.get('/', weatherController.getWeatherByLocation.bind(weatherController));

    return router;
};