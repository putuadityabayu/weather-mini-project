/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import logger from '@src/utils/logger';

export class NotificationService {
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