import grpc from '@grpc/grpc-js';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { server } from './server.js';

dotenv.config();

// Start server
const PORT = process.env.PORT || 50053;
const HOST = process.env.HOST || '0.0.0.0';

server.bindAsync(
  `${HOST}:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      logger.error('Failed to bind server:', err);
      process.exit(1);
    }

    logger.info(`🚀 Security Service started on ${HOST}:${PORT}`);
    logger.info('🛡️ Threat Detection ready');
    logger.info('🔍 Security Monitoring ready');
    logger.info('🚨 Security Alerts ready');
    logger.info('🤖 Machine Learning ready');
  }
);

export default server;