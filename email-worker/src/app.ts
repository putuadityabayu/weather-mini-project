/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import { connectRabbitMQConsumer, closeRabbitMQ } from './config/rabbitmq';
import { NotificationService } from './services/notification.service';
import logger from './utils/logger';

const notificationService = new NotificationService();

export default async function startWorker() {
    try {
        await connectRabbitMQConsumer(notificationService);
        logger.info('Email Notification Worker started and listening for messages.');
    } catch (error) {
        logger.error('Failed to start Email Notification Worker:', error);
        process.exit(1);
    }
};