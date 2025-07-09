/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import { NotificationService } from '@src/services/notification.service';
import logger from '@src/utils/logger';
import { getRabbitMQChannel } from '@src/config/rabbitmq';
import { Channel } from 'amqplib';

jest.mock('@src/utils/logger');
jest.mock('@src/config/rabbitmq', () => ({
    getRabbitMQChannel: jest.fn(),
    connectRabbitMQ: jest.fn(),
    closeRabbitMQ: jest.fn(),
}));


describe('NotificationService', () => {
    let notificationService: NotificationService;

    // Mock objek channel yang akan dikembalikan oleh getRabbitMQChannel
    const mockAck = jest.fn();
    const mockNack = jest.fn();
    const mockAssertQueue = jest.fn();
    const mockConsume = jest.fn();

    // Pastikan mockChannel sesuai dengan interface Channel
    const mockChannel: Partial<Channel> = {
        assertQueue: mockAssertQueue,
        consume: mockConsume,
        ack: mockAck,
        nack: mockNack,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Konfigurasi getRabbitMQChannel untuk selalu mengembalikan mockChannel kita
        (getRabbitMQChannel as jest.Mock).mockReturnValue(mockChannel);

        notificationService = new NotificationService();

        // Reset implementasi consume setiap test
        mockConsume.mockImplementation((queue, callback, options) => {
            // Default: do nothing, actual message will be triggered by test
        });

        // spyOn sendEmailNotification internal agar bisa memverifikasi panggilannya
        jest.spyOn(notificationService, 'sendEmailNotification');
    });

    afterEach(() => {
        jest.restoreAllMocks(); // Kembalikan spyOn setelah setiap test
    });

    describe('connectRabbitMQConsumer', () => {
        it('should get RabbitMQ channel, assert queue, and start consuming messages', async () => {
            await notificationService.connectRabbitMQConsumer();

            expect(getRabbitMQChannel).toHaveBeenCalledTimes(1); // Memverifikasi bahwa channel diminta
            expect(mockChannel.assertQueue).toHaveBeenCalledWith('weather_refresh_events', { durable: true });
            expect(mockChannel.consume).toHaveBeenCalledWith(
                'weather_refresh_events',
                expect.any(Function), // Callback function
                { noAck: false }
            );
            expect(logger.info).toHaveBeenCalledWith('Email Worker connected to RabbitMQ and asserted queue: weather_refresh_events');
            expect(logger.error).not.toHaveBeenCalled(); // Pastikan tidak ada error log
        });

        it('should process a valid message, call sendEmailNotification, and ack the message', async () => {
            await notificationService.connectRabbitMQConsumer();

            const messagePayload = { location: 'Jakarta' };
            const messageContent = JSON.stringify(messagePayload);
            const mockMessage = { content: Buffer.from(messageContent), fields: {}, properties: {} } as any;

            // Panggil callback consume secara manual untuk mensimulasikan pesan masuk
            // Akses panggilan consume yang pertama, lalu argumen kedua adalah callback-nya
            const consumeCallback = (mockChannel.consume as jest.Mock).mock.calls[0][1];
            await consumeCallback(mockMessage);

            expect(logger.debug).toHaveBeenCalledWith(`Received message: ${JSON.stringify(messagePayload)}`);
            expect(notificationService.sendEmailNotification).toHaveBeenCalledWith('Jakarta');
            expect(mockAck).toHaveBeenCalledWith(mockMessage);
            expect(logger.debug).toHaveBeenCalledWith(`Message acknowledged for location: ${messagePayload.location}`);
            expect(mockNack).not.toHaveBeenCalled();
            expect(logger.error).not.toHaveBeenCalled();
        });

        it('should log an error and nack the message if message content is invalid JSON', async () => {
            await notificationService.connectRabbitMQConsumer();

            const invalidMessageContent = 'not a valid json';
            const mockMessage = { content: Buffer.from(invalidMessageContent), fields: {}, properties: {} } as any;

            const consumeCallback = (mockChannel.consume as jest.Mock).mock.calls[0][1];
            await consumeCallback(mockMessage);

            expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error processing message:'), expect.any(SyntaxError));
            expect(notificationService.sendEmailNotification).not.toHaveBeenCalled(); // Tidak boleh dipanggil jika parsing gagal
            expect(mockAck).not.toHaveBeenCalled();
            expect(mockNack).toHaveBeenCalledWith(mockMessage, false, true);
        });

        it('should log an error and nack the message if sendEmailNotification fails', async () => {
            await notificationService.connectRabbitMQConsumer();
            const mockEmailError = new Error('Email sending failed');
            // Mock implementasi sendEmailNotification untuk gagal
            (notificationService.sendEmailNotification as jest.Mock).mockRejectedValueOnce(mockEmailError);

            const messagePayload = { location: 'Denpasar' };
            const messageContent = JSON.stringify(messagePayload);
            const mockMessage = { content: Buffer.from(messageContent), fields: {}, properties: {} } as any;

            const consumeCallback = (mockChannel.consume as jest.Mock).mock.calls[0][1];
            await consumeCallback(mockMessage);

            expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error processing message:'), mockEmailError);
            expect(notificationService.sendEmailNotification).toHaveBeenCalledWith('Denpasar');
            expect(mockAck).not.toHaveBeenCalled();
            expect(mockNack).toHaveBeenCalledWith(mockMessage, false, true);
        });

        it('should log an error and exit if getting channel or asserting queue fails', async () => {
            const mockSetupError = new Error('RabbitMQ setup failed');
            // Mock getRabbitMQChannel agar gagal (melempar error)
            (getRabbitMQChannel as jest.Mock).mockImplementationOnce(() => {
                throw mockSetupError;
            });

            await expect(notificationService.connectRabbitMQConsumer()).rejects.toThrow(mockSetupError);
            expect(logger.error).toHaveBeenCalledWith('Failed to connect to RabbitMQ for consumer', mockSetupError);
            expect(mockChannel.assertQueue).not.toHaveBeenCalled();
        });
    });

    describe('sendEmailNotification', () => {
        // Gunakan fake timers untuk menguji setTimeout
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.runOnlyPendingTimers();
            jest.useRealTimers();
        });

        it('should log debug messages and resolve after a delay', async () => {
            const location = 'New York';
            const promise = notificationService.sendEmailNotification(location);

            expect(logger.debug).not.toHaveBeenCalled(); // Belum dipanggil karena ada setTimeout

            jest.advanceTimersByTime(1000); // Majukan waktu 1 detik

            await promise; // Tunggu promise selesai

            expect(logger.debug).toHaveBeenCalledWith(`Simulating email notification for weather refresh in ${location}.`);
            expect(logger.debug).toHaveBeenCalledWith(`Email content: "Weather data for ${location} has been refreshed."`);
            expect(logger.error).not.toHaveBeenCalled();
        });
    });
});