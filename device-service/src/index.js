import grpc from '@grpc/grpc-js';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { server } from './server.js';

dotenv.config();

// Start server
const PORT = process.env.PORT || 50052;
const HOST = process.env.HOST || '0.0.0.0';

server.bindAsync(
  `${HOST}:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      logger.error('Failed to bind server:', err);
      process.exit(1);
    }

    logger.info(`🚀 Device Service started on ${HOST}:${PORT}`);
    logger.info('📱 Device Management ready');
    logger.info('🔐 Session Management ready');
    logger.info('⚡ Device Fingerprinting ready');
    logger.info('🛡️ Security Integration ready');
  }
);

export default server;