import grpc from '@grpc/grpc-js';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { server } from './server.js';
import { initializeBackgroundService } from './background/registerJobHandlers.js';
import { healthCheck as grpcHealthCheck } from './grpc/clients.js';

dotenv.config();

// Start server
const PORT = process.env.PORT || 50051;
const HOST = process.env.HOST || '0.0.0.0';

server.bindAsync(`${HOST}:${PORT}`, grpc.ServerCredentials.createInsecure(), async (err, port) => {
  if (err) {
    logger.error('Failed to bind server:', err);
    process.exit(1);
  }

  try {
    // Initialize background service with job handlers
    await initializeBackgroundService();
    logger.info('🔄 Background service initialized with job handlers');

    // Check gRPC clients health
    const grpcHealth = await grpcHealthCheck();
    logger.info('🔗 gRPC clients health check:', grpcHealth);
  } catch (error) {
    logger.error('Failed to initialize background service:', error);
    // Don't exit, continue with server startup
  }

  logger.info(`🚀 Auth Service started on ${HOST}:${port}`);
  logger.info('📊 Master-Slave Database Pattern enabled');
  logger.info('🔐 JWT Authentication ready');
  logger.info('⚡ Functional Programming approach');
  logger.info('🔄 Background job processing enabled');
});

export default server;
