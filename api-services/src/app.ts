/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '@src/config';
import { connectMongoDB, disconnectMongoDB } from '@src/config/db';
import { connectRedis, disconnectRedis } from '@src/config/redis';
import { connectRabbitMQ, closeRabbitMQ } from './config/rabbitmq';
import logger from '@src/utils/logger';
import { errorHandler } from '@src/utils/error-handler';
import { registerAllRoutes } from './routes';

const app = express();

// Middlewares
app.use(express.json()); // Body parser
app.use(cors()); // Enable CORS
app.use(helmet()); // Security headers

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('API Service is healthy!');
});

// Start the server
export default async function startServer() {
    try {
        logger.info("Starting server...")

        await Promise.all([
            connectMongoDB(),
            connectRedis(),
            connectRabbitMQ()
        ])

        registerAllRoutes(app);

        // Global error handler
        app.use(errorHandler);

        app.listen(config.port, () => {
            logger.info(`API Service running on port ${config.port}`);
        });
    } catch (err) {
        logger.error('Failed to start API Service:', err);
        process.exit(1);
    }
};

// Handle graceful shutdown
export async function gracefulShutdown() {
    try {
        logger.info("Shutdown...")
        await Promise.all([
            disconnectMongoDB(),
            disconnectRedis(),
            closeRabbitMQ()
        ]);
    } catch (error) {
        logger.error('Error during graceful shutdown:', error);
    }
}