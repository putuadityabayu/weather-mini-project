/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import { Document } from 'mongoose';

export interface IWeather {
    location: string;
    temperature: number;
    description: string;
    humidity: number;
    windSpeed: number;
    timestamp: Date;
    source: 'cache' | 'external';
}

export interface IWeatherDocument extends IWeather, Document { }