/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import { WeatherModel } from '../models/weather.model';
import { IWeather } from '../interfaces/weather.interface';

export class WeatherRepository {
    async findByLocation(location: string): Promise<IWeather | null> {
        return WeatherModel.findOne({ location: new RegExp(`^${location}$`, 'i') }).lean();
    }

    async upsert(location: string, weatherData: Omit<IWeather, 'location' | 'source'>): Promise<IWeather> {
        const updatedWeather = await WeatherModel.findOneAndUpdate(
            { location: new RegExp(`^${location}$`, 'i') },
            { ...weatherData, location: location },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();
        return updatedWeather as IWeather;
    }
}