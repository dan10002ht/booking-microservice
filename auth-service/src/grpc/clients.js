import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import logger from '../utils/logger.js';

// gRPC client options
const clientOptions = {
  'grpc.keepalive_time_ms': 30000,
  'grpc.keepalive_timeout_ms': 5000,
  'grpc.keepalive_permit_without_calls': true,
  'grpc.http2.max_pings_without_data': 0,
  'grpc.http2.min_time_between_pings_ms': 10000,
  'grpc.http2.min_ping_interval_without_data_ms': 300000,
  'grpc.max_receive_message_length': 4 * 1024 * 1024, // 4MB
  'grpc.max_send_message_length': 4 * 1024 * 1024, // 4MB
};

const loadProto = (protoFile) => {
  const protoPath = path.join(process.cwd(), '..', 'shared-lib', 'protos', protoFile);
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  return grpc.loadPackageDefinition(packageDefinition);
};

const createClient = (serviceUrl, serviceName, packageName) => {
  try {
    logger.info(`🔧 Creating gRPC client for ${serviceName} at ${serviceUrl}`);

    const proto = loadProto(`${serviceName}.proto`);

    const serviceClassName = `${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service`;

    if (!proto[packageName]) {
      throw new Error(`Package '${packageName}' not found in proto`);
    }

    if (!proto[packageName][serviceClassName]) {
      throw new Error(`Service '${serviceClassName}' not found in package '${packageName}'`);
    }

    logger.info(`✅ Proto loaded successfully for ${serviceName}`);

    const client = new proto[packageName][serviceClassName](
      serviceUrl,
      grpc.credentials.createInsecure(),
      clientOptions
    );

    logger.info(`✅ gRPC client created for ${serviceName}`);

    const wrappedClient = {};
    // Lấy đủ method từ cả instance và prototype
    const instanceMethods = Object.keys(client);
    const protoMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(client)).filter(
      (m) => typeof client[m] === 'function' && m !== 'constructor'
    );
    const allMethods = Array.from(new Set([...instanceMethods, ...protoMethods]));

    allMethods.forEach((method) => {
      if (typeof client[method] === 'function') {
        wrappedClient[method] = (request) => {
          return new Promise((resolve, reject) => {
            const metadata = new grpc.Metadata();
            metadata.add('correlation-id', request.correlationId || 'unknown');

            // Create a new deadline for each call
            const deadline = new Date();
            deadline.setSeconds(deadline.getSeconds() + 60);

            const callOptions = {
              deadline,
              // Add additional gRPC options for better reliability
              'grpc.keepalive_time_ms': 30000,
              'grpc.keepalive_timeout_ms': 5000,
              'grpc.keepalive_permit_without_calls': true,
              'grpc.http2.max_pings_without_data': 0,
              'grpc.http2.min_time_between_pings_ms': 10000,
              'grpc.http2.min_ping_interval_without_data_ms': 300000,
            };

            client[method](request, metadata, callOptions, (error, response) => {
              if (error) {
                logger.error(`gRPC call failed: ${serviceName}.${method}`, {
                  error: error.message,
                  code: error.code,
                  details: error.details,
                  correlationId: request.correlationId,
                });
                reject(error);
              } else {
                resolve(response);
              }
            });
          });
        };
      }
    });

    logger.info(
      `Successfully created gRPC client for ${serviceName} with ${Object.keys(wrappedClient).length} methods`
    );

    return wrappedClient;
  } catch (error) {
    logger.error(`Failed to create gRPC client for ${serviceName}`, {
      error: error.message,
      serviceUrl,
      stack: error.stack,
    });

    // Return a mock client with error methods instead of undefined
    return {
      sendVerificationEmail: () =>
        Promise.reject(new Error(`gRPC client for ${serviceName} failed to initialize`)),
      sendEmail: () =>
        Promise.reject(new Error(`gRPC client for ${serviceName} failed to initialize`)),
      health: () =>
        Promise.reject(new Error(`gRPC client for ${serviceName} failed to initialize`)),
    };
  }
};

// Initialize gRPC clients
const grpcClients = {
  emailVerificationService: createClient(
    process.env.EMAIL_WORKER_URL || 'localhost:50060',
    'emailVerification',
    'email'
  ),
  emailService: createClient(process.env.EMAIL_WORKER_URL || 'localhost:50060', 'email', 'email'),
  // Add other services as needed
  // userService: createClient(process.env.USER_SERVICE_URL || 'localhost:50052', 'user', 'user'),
  // notificationService: createClient(process.env.NOTIFICATION_SERVICE_URL || 'localhost:50053', 'notification', 'notification'),
};

// Health check for all clients
const healthCheck = async () => {
  const results = {};

  for (const [serviceName, client] of Object.entries(grpcClients)) {
    try {
      if (client.health) {
        const result = await client.health({});
        results[serviceName] = { status: 'healthy', response: result };
      } else {
        results[serviceName] = { status: 'no_health_method' };
      }
    } catch (error) {
      results[serviceName] = { status: 'unhealthy', error: error.message };
    }
  }

  return results;
};

// Shutdown all clients
const shutdown = () => {
  logger.info('Shutting down gRPC clients...');
  // gRPC clients don't need explicit shutdown in Node.js
  logger.info('gRPC clients shutdown completed');
};

export { grpcClients, healthCheck, shutdown };
export default grpcClients;
