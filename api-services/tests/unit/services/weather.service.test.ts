/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import { WeatherService } from '@src/services/weather.service';
import { WeatherRepository } from '@src/repositories/weather.repository';
import { CacheRepository } from '@src/repositories/cache.repository';
import { publishToQueue } from '@src/config/rabbitmq';
import logger from '@src/utils/logger';
import { IWeather } from '@src/interfaces/weather.interface';
import axios, { AxiosError, AxiosHeaders, isAxiosError } from 'axios';

// Mock the dependencies
jest.mock('axios');
jest.mock('@src/repositories/weather.repository');
jest.mock('@src/repositories/cache.repository');
jest.mock('@src/config/rabbitmq');
jest.mock('@src/utils/logger');

const mockWeatherService = new WeatherService(
    {} as any,
    {} as any
) as jest.Mocked<WeatherService>;

describe('WeatherService', () => {
    let weatherService: WeatherService;
    let weatherRepository: jest.Mocked<WeatherRepository>;
    let cacheRepository: jest.Mocked<CacheRepository>;
    let mockedAxios: jest.Mocked<typeof axios>;

    const mockWeatherData: IWeather = {
        location: 'Malang',
        temperature: 25,
        description: 'Partly cloudy',
        humidity: 40,
        windSpeed: 20,
        timestamp: new Date(),
        source: 'external'
    };

    beforeEach(() => {
        weatherRepository = new WeatherRepository() as jest.Mocked<WeatherRepository>;
        cacheRepository = new CacheRepository() as jest.Mocked<CacheRepository>;
        mockedAxios = axios as jest.Mocked<typeof axios>;
        // Manually inject the mocked dependencies
        weatherService = new WeatherService(weatherRepository, cacheRepository);

        // Reset all mock calls before each test
        jest.clearAllMocks();
    });

    describe('getWeatherData', () => {
        it('should return cached data if available and not refreshed', async () => {
            cacheRepository.get.mockResolvedValue(mockWeatherData);
            weatherRepository.findByLocation.mockResolvedValue(mockWeatherData); // Should not be called if cached
            mockedAxios.get.mockResolvedValue({ data: mockWeatherData });
            (publishToQueue as jest.Mock).mockResolvedValue(undefined); // Mock RabbitMQ publish

            const result = await weatherService.getWeatherData('Malang', false);

            expect(cacheRepository.get).toHaveBeenCalledWith('weather:malang');
            expect(weatherRepository.findByLocation).not.toHaveBeenCalled(); // Cache hit, so no DB lookup
            expect(cacheRepository.set).not.toHaveBeenCalled(); // No new cache set
            expect(publishToQueue).not.toHaveBeenCalled(); // No refresh, so no message published
            expect(logger.debug).toHaveBeenCalledWith(`Serving weather data for Malang from cache.`);
            expect(mockedAxios.get).not.toHaveBeenCalled();
            expect(result).toEqual({ ...mockWeatherData, source: 'cache' });
        });

        it('should fetch from external API, save to DB and cache, and return data on cache miss', async () => {
            cacheRepository.get.mockResolvedValue(null); // Simulate cache miss
            weatherRepository.findByLocation.mockResolvedValue(null); // Simulate not found in DB either
            weatherRepository.upsert.mockResolvedValue(mockWeatherData); // Mock successful save
            cacheRepository.set.mockResolvedValue(undefined); // Mock successful cache set
            mockedAxios.get.mockResolvedValue({
                data: {
                    name: "Mataram",
                    main: { temp: mockWeatherData.temperature, humidity: mockWeatherData.humidity, windSpeed: mockWeatherData.windSpeed },
                    wind: { speed: mockWeatherData.windSpeed },
                    weather: [{ description: mockWeatherData.description }],
                    dt: Math.floor(mockWeatherData.timestamp.getTime() / 1000) // Waktu dalam detik
                }
            });
            (publishToQueue as jest.Mock).mockResolvedValue(undefined); // Mock RabbitMQ publish

            const result = await weatherService.getWeatherData('Mataram', false);

            expect(weatherRepository.findByLocation).toHaveBeenCalledWith('Mataram');
            expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('api.openweathermap.org/data/2.5/weather'), expect.objectContaining({ params: expect.objectContaining({ q: "Mataram" }) }));
            expect(weatherRepository.upsert).toHaveBeenCalledWith("Mataram", expect.objectContaining({ location: 'Mataram' }));
            expect(cacheRepository.set).toHaveBeenCalledWith('weather:mataram', expect.objectContaining({ location: 'Mataram' }));
            expect(logger.debug).toHaveBeenCalledWith('Fetching weather data for Mataram from external API.');
            expect(logger.debug).toHaveBeenCalledWith('Saved weather data for Mataram to MongoDB.');
            expect(logger.debug).toHaveBeenCalledWith('Cached weather data for Mataram in Redis.');
            expect(result).toMatchObject({ ...mockWeatherData, location: "Mataram", timestamp: result?.timestamp });
            expect(publishToQueue).not.toHaveBeenCalled();
        });

        it('should fetch from external API, save to DB and cache, and publish message on refresh', async () => {
            const mockData = { ...mockWeatherData, location: "Denpasar" }
            weatherRepository.upsert.mockResolvedValue(mockData);
            cacheRepository.set.mockResolvedValue(undefined);
            mockedAxios.get.mockResolvedValue({
                data: {
                    name: mockData.location,
                    main: { temp: mockData.temperature, humidity: mockData.humidity, windSpeed: mockData.windSpeed },
                    wind: { speed: mockData.windSpeed },
                    weather: [{ description: mockData.description }],
                    dt: Math.floor(mockData.timestamp.getTime() / 1000) // Waktu dalam detik
                }
            });
            (publishToQueue as jest.Mock).mockResolvedValue(undefined); // Ensure mock is called

            const result = await weatherService.getWeatherData('Denpasar', true); // Explicit refresh

            expect(cacheRepository.invalidate).toHaveBeenCalledWith('weather:denpasar'); // Cache should be deleted
            expect(logger.debug).toHaveBeenCalledWith('Forcing refresh, invalidating cache for Denpasar');
            expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('api.openweathermap.org/data/2.5/weather'), expect.objectContaining({ params: expect.objectContaining({ q: "Denpasar" }) }));
            expect(weatherRepository.upsert).toHaveBeenCalledWith("Denpasar", expect.objectContaining({ location: 'Denpasar' }));
            expect(cacheRepository.set).toHaveBeenCalledWith('weather:denpasar', expect.objectContaining({ location: 'Denpasar' }));
            expect(publishToQueue).toHaveBeenCalledWith('weather_refresh_events', expect.objectContaining({ location: 'Denpasar' }));
            expect(logger.debug).toHaveBeenCalledWith('Forcing refresh, invalidating cache for Denpasar');
            expect(logger.debug).toHaveBeenCalledWith('Fetching weather data for Denpasar from external API.');
            expect(logger.debug).toHaveBeenCalledWith('Saved weather data for Denpasar to MongoDB.');
            expect(result).toEqual({ ...mockData, timestamp: result?.timestamp });
        });

        it('should handle errors during external API fetch', async () => {
            cacheRepository.get.mockResolvedValue(null); // Cache miss
            weatherRepository.findByLocation.mockResolvedValue(null); // Not in DB
            const mockApiError = new Error('API down');
            mockedAxios.get.mockRejectedValue(mockApiError);

            await expect(weatherService.getWeatherData('Surabaya', false)).rejects.toThrow('Failed to fetch weather data from external source.');

            expect(logger.error).toHaveBeenCalledWith('Error fetching weather from external API for Surabaya:', mockApiError);
            expect(weatherRepository.upsert).not.toHaveBeenCalled();
            expect(cacheRepository.set).not.toHaveBeenCalled();
            expect(publishToQueue).not.toHaveBeenCalled();
            expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('api.openweathermap.org/data/2.5/weather'), expect.objectContaining({ params: expect.objectContaining({ q: "Surabaya" }) }));
        });

        it('should use DB if data exists in DB', async () => {
            cacheRepository.get.mockResolvedValue(null); // Cache miss
            const dbFallbackData = { ...mockWeatherData, location: 'Bandung', temperature: 5 };
            weatherRepository.findByLocation.mockResolvedValue(dbFallbackData); // Data ditemukan di DB

            const result = await weatherService.getWeatherData('Bandung', false);

            expect(cacheRepository.get).toHaveBeenCalledWith('weather:bandung');
            expect(cacheRepository.set).toHaveBeenCalled();
            expect(weatherRepository.findByLocation).toHaveBeenCalledWith('Bandung');
            expect(result).toEqual(dbFallbackData);
            expect(weatherRepository.upsert).not.toHaveBeenCalled();
        });

        it('should throw error if external API fails and no data in DB', async () => {
            cacheRepository.get.mockResolvedValue(null); // Cache miss
            // const mockApiError = new AxiosError("Location not found", "111", undefined, undefined, { status: 404, data: null, statusText: "Not Found", headers: {}, config: { headers: new AxiosHeaders() } });
            const mockApiError = {
                isAxiosError: true, response: { status: 404, data: null, statusText: "Not Found", headers: {}, config: { headers: new AxiosHeaders() } }
            };
            mockedAxios.isAxiosError.mockReturnValue(true);
            mockedAxios.get.mockRejectedValue(mockApiError); // Location not found
            weatherRepository.findByLocation.mockResolvedValue(null); // Data tidak ditemukan di DB

            await expect(weatherService.getWeatherData('Jakarta', false)).resolves.toBe(null);

            expect(cacheRepository.get).toHaveBeenCalledWith('weather:jakarta');
            expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('api.openweathermap.org/data/2.5/weather'), expect.objectContaining({ params: expect.objectContaining({ q: "Jakarta" }) }));
            expect(logger.error).toHaveBeenCalledWith('Error fetching weather from external API for Jakarta:', mockApiError);
            expect(weatherRepository.findByLocation).toHaveBeenCalledWith('Jakarta');
            expect(weatherRepository.upsert).not.toHaveBeenCalled();
            expect(cacheRepository.set).not.toHaveBeenCalled();
        });
    });
});