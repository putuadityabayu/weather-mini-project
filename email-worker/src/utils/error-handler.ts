/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import { Request, Response, NextFunction } from 'express';
import logger from './logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(`Unhandled error: ${err.message}`, err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'An unexpected error occurred.';

    res.status(statusCode).json({
        error: message,
        // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Include stack only in dev
    });
};