import grpc from '@grpc/grpc-js';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { server } from './server.js';

dotenv.config();

// Start server
const PORT = process.env.PORT || 50051;
const HOST = process.env.HOST || '0.0.0.0';

server.bindAsync(`${HOST}:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    logger.error('Failed to bind server:', err);
    process.exit(1);
  }

  logger.info(`🚀 Auth Service started on ${HOST}:${PORT}`);
  logger.info('📊 Master-Slave Database Pattern enabled');
  logger.info('🔐 JWT Authentication ready');
  logger.info('⚡ Functional Programming approach');
});

export default server;
