/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://rabbitmq',
};