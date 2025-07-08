import request from 'supertest';
import express, { Express } from 'express';
import { WeatherController } from '@src/controllers/weather.controller';
import { WeatherService } from '@src/services/weather.service';
import logger from '@src/utils/logger';
import { IWeather } from '@src/interfaces/weather.interface';
import { errorHandler } from '@src/utils/error-handler';

// Mock the WeatherService dependency
jest.mock('@src/services/weather.service');
jest.mock('@src/utils/logger');

// Create a mock instance of WeatherService
const mockWeatherService = new WeatherService(
    {} as any,
    {} as any
) as jest.Mocked<WeatherService>;

describe('WeatherController', () => {
    let app: Express;
    let weatherController: WeatherController;

    const mockWeatherData: IWeather = {
        location: 'Bandung',
        temperature: 25,
        description: 'Partly cloudy',
        humidity: 40,
        windSpeed: 20,
        timestamp: new Date(),
        source: 'external'
    };

    beforeAll(() => {
        // Initialize the controller with the mocked service
        weatherController = new WeatherController(mockWeatherService);

        // Create a simple Express app to test the controller's route handler
        app = express();
        app.use(express.json());
        // Bind the controller method to its instance for correct 'this' context
        app.get('/weather', weatherController.getWeatherByLocation.bind(weatherController));
        app.use(errorHandler);
    });

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    describe('GET /weather', () => {
        it('should return weather data for a valid location', async () => {
            // Configure the mock service to return specific data
            mockWeatherService.getWeatherData.mockResolvedValue(mockWeatherData);

            const response = await request(app)
                .get('/weather')
                .query({ location: 'Bandung' });

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ success: true, data: JSON.parse(JSON.stringify(mockWeatherData)) });
            expect(mockWeatherService.getWeatherData).toHaveBeenCalledWith('Bandung', false);
        });

        it('should handle refresh parameter correctly', async () => {
            mockWeatherService.getWeatherData.mockResolvedValue(mockWeatherData);

            const response = await request(app)
                .get('/weather')
                .query({ location: 'Jakarta', refresh: 'true' });

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ success: true, data: JSON.parse(JSON.stringify(mockWeatherData)) });
            expect(mockWeatherService.getWeatherData).toHaveBeenCalledWith('Jakarta', true);
        });

        it('should return 400 if location is missing', async () => {
            const response = await request(app)
                .get('/weather');

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({ success: false, error: 'Location query parameter is required.' });
            expect(mockWeatherService.getWeatherData).not.toHaveBeenCalled();
        });

        it('should return 500 if WeatherService throws an error', async () => {
            const errorMessage = 'Failed to fetch weather data';
            mockWeatherService.getWeatherData.mockRejectedValue(new Error(errorMessage));

            const response = await request(app)
                .get('/weather')
                .query({ location: 'Surabaya' });

            expect(response.statusCode).toBe(500);
            expect(response.body).toEqual({ success: false, error: errorMessage });
            expect(logger.error).toHaveBeenCalledWith(`Error in getWeatherByLocation for Surabaya:`, expect.any(Error));
            expect(mockWeatherService.getWeatherData).toHaveBeenCalledWith('Surabaya', false);
        });
    });
});