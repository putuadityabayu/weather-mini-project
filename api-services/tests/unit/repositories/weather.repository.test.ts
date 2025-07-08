import { WeatherModel } from '@src/models/weather.model';
import { WeatherRepository } from '@src/repositories/weather.repository';
import { IWeather } from '@src/interfaces/weather.interface';

// Mock all module WeatherModel
jest.mock('@src/models/weather.model', () => ({
    WeatherModel: {
        findOne: jest.fn().mockReturnThis(),
        findOneAndUpdate: jest.fn().mockReturnThis(),
        lean: jest.fn(),
    },
}));


const mockWeatherModel = WeatherModel as jest.Mocked<typeof WeatherModel> & {
    lean: jest.Mock;
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
};

describe('WeatherRepository', () => {
    let weatherRepository: WeatherRepository;

    beforeEach(() => {
        weatherRepository = new WeatherRepository();
        jest.clearAllMocks();
    });

    // Test findByLocation method
    describe('findByLocation', () => {
        it('should return weather data if found', async () => {
            const mockResult: IWeather = {
                location: 'London',
                temperature: 10,
                description: 'Cloudy',
                humidity: 40,
                windSpeed: 20,
                timestamp: new Date(),
                source: 'external',
            };


            mockWeatherModel.findOne.mockReturnThis();
            mockWeatherModel.lean.mockResolvedValue(mockResult);

            const result = await weatherRepository.findByLocation('London');

            expect(mockWeatherModel.findOne).toHaveBeenCalledWith({ location: new RegExp(`^London$`, 'i') });
            expect(mockWeatherModel.lean).toHaveBeenCalled();
            expect(result).toEqual(mockResult);
        });

        it('should return null if weather data is not found', async () => {
            mockWeatherModel.findOne.mockReturnThis();
            mockWeatherModel.lean.mockResolvedValue(null);

            const result = await weatherRepository.findByLocation('NonExistentCity');

            expect(mockWeatherModel.findOne).toHaveBeenCalledWith({ location: new RegExp(`^NonExistentCity$`, 'i') });
            expect(mockWeatherModel.lean).toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it('should throw an error if Mongoose operation fails', async () => {
            const mockError = new Error('Mongoose find error');
            mockWeatherModel.findOne.mockImplementation(() => {
                throw mockError;
            });

            await expect(weatherRepository.findByLocation('London')).rejects.toThrow('Mongoose find error');
            expect(mockWeatherModel.findOne).toHaveBeenCalledWith({ location: new RegExp(`^London$`, 'i') });
        });
    });

    // Test upsert method
    describe('upsert', () => {
        const location = 'Paris';
        const weatherDataToSave: Omit<IWeather, 'location' | 'source'> = {
            temperature: 15,
            description: 'Sunny',
            humidity: 40,
            windSpeed: 20,
            timestamp: new Date(),
        };
        const expectedSavedData: IWeather = {
            ...weatherDataToSave,
            location: location,
            source: 'external',
        };

        it('should create new weather data if not found and return it', async () => {
            mockWeatherModel.findOneAndUpdate.mockReturnThis();
            mockWeatherModel.lean.mockResolvedValue(expectedSavedData);

            const result = await weatherRepository.upsert(location, weatherDataToSave);

            expect(mockWeatherModel.findOneAndUpdate).toHaveBeenCalledWith(
                { location: new RegExp(`^${location}$`, 'i') },
                { ...weatherDataToSave, location: location },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            expect(mockWeatherModel.lean).toHaveBeenCalled();
            expect(result).toEqual(expectedSavedData);
        });

        it('should update existing weather data if found and return it', async () => {
            mockWeatherModel.findOneAndUpdate.mockReturnThis();
            mockWeatherModel.lean.mockResolvedValue(expectedSavedData);

            const result = await weatherRepository.upsert(location, weatherDataToSave);

            expect(mockWeatherModel.findOneAndUpdate).toHaveBeenCalledWith(
                { location: new RegExp(`^${location}$`, 'i') },
                { ...weatherDataToSave, location: location },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            expect(mockWeatherModel.lean).toHaveBeenCalled();
            expect(result).toEqual(expectedSavedData);
        });

        it('should throw an error if Mongoose upsert operation fails', async () => {
            const mockError = new Error('Mongoose upsert error');
            mockWeatherModel.findOneAndUpdate.mockImplementation(() => {
                throw mockError;
            });

            await expect(weatherRepository.upsert(location, weatherDataToSave)).rejects.toThrow('Mongoose upsert error');
            expect(mockWeatherModel.findOneAndUpdate).toHaveBeenCalled();
        });
    });
});