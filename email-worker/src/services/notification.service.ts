/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import { getRabbitMQChannel } from '@src/config/rabbitmq';
import logger from '@src/utils/logger';
import { ConsumeMessage } from 'amqplib';

export class NotificationService {
    async connectRabbitMQConsumer() {
        try {
            const channel = getRabbitMQChannel();
            await channel.assertQueue('weather_refresh_events', { durable: true });
            logger.info('Email Worker connected to RabbitMQ and asserted queue: weather_refresh_events');

            channel.consume('weather_refresh_events', async (msg: ConsumeMessage | null) => {
                if (msg) {
                    try {
                        const messageContent = JSON.parse(msg.content.toString());
                        logger.debug(`Received message: ${JSON.stringify(messageContent)}`);

                        // Sending email
                        await this.sendEmailNotification(messageContent.location);

                        channel?.ack(msg); // Acknowledge message
                        logger.debug(`Message acknowledged for location: ${messageContent.location}`);
                    } catch (error) {
                        logger.error('Error processing message:', error);
                        channel?.nack(msg, false, true); // Nack the message, requeue it
                    }
                }
            }, { noAck: false });

        } catch (error) {
            logger.error('Failed to connect to RabbitMQ for consumer', error);
            throw error;
        }
    }

    async sendEmailNotification(location: string): Promise<void> {
        // This is where actual email sending logic would go (e.g., using Nodemailer, SendGrid, etc.)
        // For this task, we'll just simulate it.
        return new Promise(resolve => {
            setTimeout(() => {
                logger.debug(`Simulating email notification for weather refresh in ${location}.`);
                logger.debug(`Email content: "Weather data for ${location} has been refreshed."`);
                // In a real app, you might check if user subscribed to this location, etc.
                resolve();
            }, 1000); // Simulate network delay for sending email
        });
    }
}