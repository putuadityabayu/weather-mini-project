/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import mongoose from 'mongoose';
import { config } from './index';
import logger from '@src/utils/logger';

export const connectMongoDB = async () => {
    try {
        await mongoose.connect(config.mongodbUri);
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error('Failed to connect to MongoDB', error);
        process.exit(1);
    }
};

export const disconnectMongoDB = async () => {
    try {
        await mongoose.disconnect();
        logger.info('Disconnected from MongoDB');
    } catch (error) {
        logger.error('Failed to disconnect from MongoDB', error);
    }
};