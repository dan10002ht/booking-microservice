import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import circuitBreakerService from '../services/circuitBreakerService.js';

// gRPC client options
const clientOptions = {
  'grpc.keepalive_time_ms': config.grpc.authService.keepaliveTimeMs,
  'grpc.keepalive_timeout_ms': config.grpc.authService.keepaliveTimeoutMs,
  'grpc.keepalive_permit_without_calls': true,
  'grpc.http2.max_pings_without_data': 0,
  'grpc.http2.min_time_between_pings_ms': 10000,
  'grpc.http2.min_ping_interval_without_data_ms': 300000,
  'grpc.max_receive_message_length': config.grpc.authService.maxReceiveMessageLength,
  'grpc.max_send_message_length': config.grpc.authService.maxSendMessageLength,
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
    console.log(`🔧 Creating gRPC client for ${serviceName} at ${serviceUrl}`);

    const proto = loadProto(`${serviceName}.proto`);

    const serviceClassName = `${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service`;

    if (!proto[packageName]) {
      throw new Error(`Package '${packageName}' not found in proto`);
    }

    if (!proto[packageName][serviceClassName]) {
      throw new Error(`Service '${serviceClassName}' not found in package '${packageName}'`);
    }

    console.log(`✅ Proto loaded successfully for ${serviceName}`);

    const client = new proto[packageName][serviceClassName](
      serviceUrl,
      grpc.credentials.createInsecure(),
      clientOptions
    );

    console.log(`✅ gRPC client created for ${serviceName}`);

    const wrappedClient = {};
    // Lấy đủ method từ cả instance và prototype
    const instanceMethods = Object.keys(client);
    const protoMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(client)).filter(
      (m) => typeof client[m] === 'function' && m !== 'constructor'
    );
    const allMethods = Array.from(new Set([...instanceMethods, ...protoMethods]));

    allMethods.forEach((method) => {
      if (typeof client[method] === 'function') {
        // Create circuit breaker for each method
        const breaker = circuitBreakerService.createGrpcBreaker(
          serviceName,
          method,
          async (request) => {
            const maxRetries = 3;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              try {
                return await new Promise((resolve, reject) => {
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
                      logger.error(
                        `gRPC call failed: ${serviceName}.${method} (attempt ${attempt})`,
                        {
                          error: error.message,
                          code: error.code,
                          details: error.details,
                          correlationId: request.correlationId,
                          attempt,
                          deadline: deadline.toISOString(),
                        }
                      );
                      reject(error);
                    } else {
                      resolve(response);
                    }
                  });
                });
              } catch (error) {
                // Don't retry on certain errors
                if (
                  error.code === grpc.status.INVALID_ARGUMENT ||
                  error.code === grpc.status.PERMISSION_DENIED ||
                  error.code === grpc.status.UNAUTHENTICATED
                ) {
                  throw error;
                }

                // If this is the last attempt, throw the error
                if (attempt === maxRetries) {
                  throw error;
                }

                // Wait before retrying (exponential backoff)
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                logger.warn(
                  `Retrying gRPC call: ${serviceName}.${method} (attempt ${attempt + 1}/${maxRetries})`,
                  {
                    service: serviceName,
                    method,
                    attempt,
                    delay,
                    error: error.message,
                  }
                );

                await new Promise((resolve) => setTimeout(resolve, delay));
              }
            }
          },
          {
            timeout: 65000, // Slightly higher than gRPC deadline to avoid conflicts
            errorThresholdPercentage: 50,
            resetTimeout: 30000,
          }
        );

        wrappedClient[method] = (request) => {
          return breaker.fire(request);
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
      registerWithEmail: () =>
        Promise.reject(new Error(`gRPC client for ${serviceName} failed to initialize`)),
      registerWithOAuth: () =>
        Promise.reject(new Error(`gRPC client for ${serviceName} failed to initialize`)),
      login: () => Promise.reject(new Error(`gRPC client for ${serviceName} failed to initialize`)),
      refreshToken: () =>
        Promise.reject(new Error(`gRPC client for ${serviceName} failed to initialize`)),
      logout: () =>
        Promise.reject(new Error(`gRPC client for ${serviceName} failed to initialize`)),
      validateToken: () =>
        Promise.reject(new Error(`gRPC client for ${serviceName} failed to initialize`)),
      health: () =>
        Promise.reject(new Error(`gRPC client for ${serviceName} failed to initialize`)),
    };
  }
};

const grpcClients = {
  authService: createClient(config.grpc.authService.url, 'auth', 'auth'),
  userService: createClient(config.grpc.userService.url, 'user', 'user'),
  eventService: createClient(config.grpc.eventService.url, 'event', 'event'),
  bookingService: createClient(config.grpc.bookingService.url, 'booking', 'booking'),
  paymentService: createClient(config.grpc.paymentService.url, 'payment', 'payment'),
  ticketService: createClient(config.grpc.ticketService.url, 'ticket', 'ticket'),
};

const healthCheck = async () => {
  const healthStatus = {};

  for (const [serviceName, client] of Object.entries(grpcClients)) {
    try {
      if (client.health) {
        await client.health({});
        healthStatus[serviceName] = 'healthy';
        continue;
      }
      healthStatus[serviceName] = 'unknown';
    } catch (error) {
      healthStatus[serviceName] = 'unhealthy';
      logger.error(`Health check failed for ${serviceName}`, {
        error: error.message,
        code: error.code,
      });
    }
  }

  return healthStatus;
};

const shutdown = () => {
  logger.info('Shutting down gRPC clients...');
  Object.values(grpcClients).forEach((client) => {
    if (client.close) {
      client.close();
    }
  });
};

export { grpcClients, healthCheck, shutdown };
export default grpcClients;
