/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import mongoose, { Schema, Model } from 'mongoose';
import { IWeatherDocument } from '../interfaces/weather.interface';

const weatherSchema: Schema = new Schema({
    location: { type: String, required: true, unique: true, index: true },
    temperature: { type: Number, required: true },
    description: { type: String, required: true },
    humidity: { type: Number, required: true },
    windSpeed: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
});

export const WeatherModel: Model<IWeatherDocument> = mongoose.model<IWeatherDocument>('Weather', weatherSchema);