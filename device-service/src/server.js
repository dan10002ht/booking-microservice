import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';
import { closeDatabaseConnections } from './config/databaseConfig.js';
import { closeRedisConnection } from './config/redisConfig.js';
import * as deviceController from './controllers/deviceController.js';
import * as sessionController from './controllers/sessionController.js';
import * as analyticsController from './controllers/analyticsController.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load protobuf definition
const dockerSharedProtoPath = path.join('/shared-lib', 'protos', 'device.proto');
const localSharedProtoPath = path.join(__dirname, '..', '..', 'shared-lib', 'protos', 'device.proto');
const localProtoPath = path.join(__dirname, 'proto', 'device.proto');

let PROTO_PATH;
if (fs.existsSync(dockerSharedProtoPath)) {
  PROTO_PATH = dockerSharedProtoPath;
  logger.info(`Using docker shared proto: ${PROTO_PATH}`);
} else if (fs.existsSync(localSharedProtoPath)) {
  PROTO_PATH = localSharedProtoPath;
  logger.info(`Using local shared proto: ${PROTO_PATH}`);
} else {
  PROTO_PATH = localProtoPath;
  logger.info(`Using local proto: ${PROTO_PATH}`);
}

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const deviceProto = grpc.loadPackageDefinition(packageDefinition).device;

// Create gRPC server
const server = new grpc.Server();

// Add DeviceService to server
server.addService(deviceProto.DeviceService.service, {
  // Device Management
  registerDevice: deviceController.registerDevice,
  getDeviceList: deviceController.getDeviceList,
  updateDeviceTrust: deviceController.updateDeviceTrust,
  revokeDevice: deviceController.revokeDevice,

  // Session Management
  getUserSessions: sessionController.getUserSessions,
  createSession: sessionController.createSession,
  revokeSession: sessionController.revokeSession,
  validateDevice: deviceController.validateDevice,

  // Analytics
  getDeviceAnalytics: analyticsController.getDeviceAnalytics
});

// Add HealthService to server
server.addService(deviceProto.HealthService.service, {
  check: deviceController.health
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Stop accepting new requests
    server.tryShutdown(() => {
      logger.info('✅ gRPC server stopped');
    });

    // Close database connections
    await closeDatabaseConnections();
    logger.info('✅ Database connections closed');

    // Close Redis connection
    await closeRedisConnection();
    logger.info('✅ Redis connection closed');

    logger.info('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

export { server, gracefulShutdown };