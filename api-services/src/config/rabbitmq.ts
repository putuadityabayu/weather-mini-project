/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import amqp, { Channel, ChannelModel } from 'amqplib';
import { config } from './index';
import logger from '@src/utils/logger';

let channel: Channel | undefined;
let connection: ChannelModel | undefined;

export const connectRabbitMQ = async () => {
    try {
        connection = await amqp.connect(config.rabbitmqUrl);
        channel = await connection.createChannel();
        await channel.assertQueue('weather_refresh_events', { durable: true });
        logger.info('Connected to RabbitMQ and asserted queue: weather_refresh_events');
    } catch (error) {
        logger.error('Failed to connect to RabbitMQ', error);
        process.exit(1);
    }
};

export const getRabbitMQChannel = (): Channel => {
    if (!channel) {
        logger.error('RabbitMQ channel is not initialized.');
        throw new Error('RabbitMQ channel not available.');
    }
    return channel;
};

export const publishToQueue = async (queueName: string, message: object) => {
    if (!channel) {
        logger.error('RabbitMQ channel is not initialized for publishing.');
        return;
    }
    try {
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), { persistent: true });
        logger.debug(`Message published to ${queueName}: ${JSON.stringify(message)}`);
    } catch (error) {
        logger.error(`Failed to publish message to ${queueName}`, error);
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