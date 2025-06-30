import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load auth service proto
const dockerSharedProtoPath = path.join('/shared-lib', 'protos', 'auth.proto');
const localSharedProtoPath = path.join(__dirname, '..', '..', '..', 'shared-lib', 'protos', 'auth.proto');
const localProtoPath = path.join(__dirname, '..', 'proto', 'auth.proto');

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

let authProto;
try {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });
  authProto = grpc.loadPackageDefinition(packageDefinition).auth;
} catch (error) {
  logger.warn('Auth proto not found, using fallback implementation');
  authProto = null;
}

// Create auth service client
let authClient = null;

const createAuthClient = () => {
  if (!authProto) {
    logger.warn('Auth proto not available, skipping client creation');
    return null;
  }

  try {
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'localhost:50051';
    const client = new authProto.AuthService(
      authServiceUrl,
      grpc.credentials.createInsecure()
    );
    
    return client;
  } catch (error) {
    logger.error('Failed to create auth client:', error);
    return null;
  }
};

// Initialize client
const initAuthClient = () => {
  if (!authClient) {
    authClient = createAuthClient();
  }
  return authClient;
};

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const client = initAuthClient();
    if (!client) {
      logger.warn('Auth client not available, skipping user profile retrieval');
      return { success: false, user: null };
    }

    const request = { user_id: userId };

    return new Promise((resolve, reject) => {
      client.getUserProfile(request, (error, response) => {
        if (error) {
          logger.error('Failed to get user profile:', error);
          resolve({ success: false, user: null });
        } else {
          logger.info('User profile retrieved successfully');
          resolve(response);
        }
      });
    });

  } catch (error) {
    logger.error('Error getting user profile:', error);
    return { success: false, user: null };
  }
};

// Validate token
export const validateToken = async (token) => {
  try {
    const client = initAuthClient();
    if (!client) {
      logger.warn('Auth client not available, skipping token validation');
      return { valid: false, user: null };
    }

    const request = { token };

    return new Promise((resolve, reject) => {
      client.validateToken(request, (error, response) => {
        if (error) {
          logger.error('Failed to validate token:', error);
          resolve({ valid: false, user: null });
        } else {
          logger.info('Token validation completed');
          resolve(response);
        }
      });
    });

  } catch (error) {
    logger.error('Error validating token:', error);
    return { valid: false, user: null };
  }
};

// Get user sessions
export const getUserSessions = async (userId) => {
  try {
    const client = initAuthClient();
    if (!client) {
      logger.warn('Auth client not available, skipping session retrieval');
      return { success: false, sessions: [] };
    }

    const request = { user_id: userId };

    return new Promise((resolve, reject) => {
      client.getUserSessions(request, (error, response) => {
        if (error) {
          logger.error('Failed to get user sessions:', error);
          resolve({ success: false, sessions: [] });
        } else {
          logger.info('User sessions retrieved successfully');
          resolve(response);
        }
      });
    });

  } catch (error) {
    logger.error('Error getting user sessions:', error);
    return { success: false, sessions: [] };
  }
};

// Health check
export const health = async () => {
  try {
    const client = initAuthClient();
    if (!client) {
      return { status: 'unavailable' };
    }

    return new Promise((resolve, reject) => {
      client.health({}, (error, response) => {
        if (error) {
          resolve({ status: 'unhealthy', error: error.message });
        } else {
          resolve({ status: 'healthy', response });
        }
      });
    });

  } catch (error) {
    return { status: 'error', error: error.message };
  }
};

export const authService = {
  getUserProfile,
  validateToken,
  getUserSessions,
  health
}; 