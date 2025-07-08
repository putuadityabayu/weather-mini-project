/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import amqp, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { config } from './index';
import logger from '@src/utils/logger';
import { NotificationService } from '@src/services/notification.service';

let channel: Channel | undefined;
let connection: ChannelModel | undefined;

export const connectRabbitMQConsumer = async (notificationService: NotificationService) => {
    try {
        connection = await amqp.connect(config.rabbitmqUrl);
        channel = await connection.createChannel();
        await channel.assertQueue('weather_refresh_events', { durable: true });
        logger.info('Email Worker connected to RabbitMQ and asserted queue: weather_refresh_events');

        channel.consume('weather_refresh_events', async (msg: ConsumeMessage | null) => {
            if (msg) {
                try {
                    const messageContent = JSON.parse(msg.content.toString());
                    logger.debug(`Received message: ${JSON.stringify(messageContent)}`);

                    // Sending email
                    await notificationService.sendEmailNotification(messageContent.location);

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
        process.exit(1);
    }
};

export const closeRabbitMQ = async () => {
    if (channel) {
        await channel.close();
        logger.info('RabbitMQ channel closed');
    }
    if (connection) {
        await connection.close();
        logger.info('RabbitMQ connection closed');
    }
};