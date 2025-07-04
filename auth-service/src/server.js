import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from './utils/logger.js';
import { closeConnections } from './config/databaseConfig.js';
import cacheService from './services/internal/cacheService.js';

// Import functional controllers
import * as authController from './controllers/authController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load protobuf definition from shared-lib
const dockerSharedProtoPath = path.join('/shared-lib', 'protos', 'auth.proto');
const localSharedProtoPath = path.join(__dirname, '..', '..', 'shared-lib', 'protos', 'auth.proto');
const localProtoPath = path.join(__dirname, 'proto', 'auth.proto');

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
  oneofs: true,
});

const authProto = grpc.loadPackageDefinition(packageDefinition).auth;

// Create gRPC server
const server = new grpc.Server();

// Add services to server
server.addService(authProto.AuthService.service, {
  // Registration & Login
  register: authController.register,
  registerWithEmail: authController.registerWithEmail,
  registerWithOAuth: authController.registerWithOAuth,
  login: authController.login,
  logout: authController.logout,

  // Token Management
  refreshToken: authController.refreshToken,
  validateToken: authController.validateToken,

  // Password Management
  changePassword: authController.changePassword,
  resetPassword: authController.resetPassword,

  // User Management
  getUserProfile: authController.getUserProfile,
  updateUserProfile: authController.updateUserProfile,
  getUserSessions: authController.getUserSessions,

  // Admin Operations
  getUsers: authController.getUsers,
  searchUsers: authController.searchUsers,
  updateUserStatus: authController.updateUserStatus,

  // Email Verification with PIN Code
  sendVerificationEmail: authController.sendVerificationEmail,
  verifyEmailWithPin: authController.verifyEmailWithPin,
  resendVerificationEmail: authController.resendVerificationEmail,

  // Health Check
  health: authController.health,
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
    await closeConnections();
    logger.info('✅ Database connections closed');

    // Close cache connection
    await cacheService.close();
    logger.info('✅ Cache connection closed');

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
