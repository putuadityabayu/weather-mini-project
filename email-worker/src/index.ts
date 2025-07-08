/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import startWorker from './app';
import { closeRabbitMQ } from './config/rabbitmq';
import logger from './utils/logger';

startWorker();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    logger.info('SIGINT signal received: Closing RabbitMQ connection...');
    await closeRabbitMQ();
    process.exit(0);
});