/**
 * Copyright (c) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Putu Aditya <aditya@portalnesia.com>
 */

import startServer, { gracefulShutdown } from "./app";
import logger from "./utils/logger";

startServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    logger.info('SIGINT signal received: Closing connections...');
    await gracefulShutdown();
    process.exit(0);
});