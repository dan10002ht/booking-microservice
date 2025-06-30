/**
 * Centralized Error Mapping Configuration
 * Maps gRPC error codes to HTTP status codes and user-friendly messages
 */

// gRPC Status Codes Reference:
// https://github.com/grpc/grpc/blob/master/doc/statuscodes.md
const GRPC_STATUS_CODES = {
  OK: 0,
  CANCELLED: 1,
  UNKNOWN: 2,
  INVALID_ARGUMENT: 3,
  DEADLINE_EXCEEDED: 4,
  NOT_FOUND: 5,
  ALREADY_EXISTS: 6,
  PERMISSION_DENIED: 7,
  RESOURCE_EXHAUSTED: 8,
  FAILED_PRECONDITION: 9,
  ABORTED: 10,
  OUT_OF_RANGE: 11,
  UNIMPLEMENTED: 12,
  INTERNAL: 13,
  UNAVAILABLE: 14,
  DATA_LOSS: 15,
  UNAUTHENTICATED: 16,
};

/**
 * Default error mapping for all services
 */
export const DEFAULT_ERROR_MAPPING = {
  [GRPC_STATUS_CODES.INVALID_ARGUMENT]: {
    status: 400,
    message: 'Invalid request data',
    code: 'INVALID_ARGUMENT',
  },
  [GRPC_STATUS_CODES.NOT_FOUND]: {
    status: 404,
    message: 'Resource not found',
    code: 'NOT_FOUND',
  },
  [GRPC_STATUS_CODES.ALREADY_EXISTS]: {
    status: 409,
    message: 'Resource already exists',
    code: 'ALREADY_EXISTS',
  },
  [GRPC_STATUS_CODES.PERMISSION_DENIED]: {
    status: 403,
    message: 'Permission denied',
    code: 'PERMISSION_DENIED',
  },
  [GRPC_STATUS_CODES.FAILED_PRECONDITION]: {
    status: 400,
    message: 'Operation failed due to precondition not met',
    code: 'FAILED_PRECONDITION',
  },
  [GRPC_STATUS_CODES.ABORTED]: {
    status: 409,
    message: 'Operation aborted',
    code: 'ABORTED',
  },
  [GRPC_STATUS_CODES.UNAUTHENTICATED]: {
    status: 401,
    message: 'Unauthorized',
    code: 'UNAUTHENTICATED',
  },
  [GRPC_STATUS_CODES.RESOURCE_EXHAUSTED]: {
    status: 429,
    message: 'Resource exhausted',
    code: 'RESOURCE_EXHAUSTED',
  },
  [GRPC_STATUS_CODES.UNAVAILABLE]: {
    status: 503,
    message: 'Service unavailable',
    code: 'UNAVAILABLE',
  },
  [GRPC_STATUS_CODES.INTERNAL]: {
    status: 500,
    message: 'Internal server error',
    code: 'INTERNAL',
  },
  [GRPC_STATUS_CODES.UNKNOWN]: {
    status: 500,
    message: 'Unknown error occurred',
    code: 'UNKNOWN',
  },
};

/**
 * Authentication Service Error Mapping
 */
export const AUTH_ERROR_MAPPING = {
  ...DEFAULT_ERROR_MAPPING,
  [GRPC_STATUS_CODES.INVALID_ARGUMENT]: {
    status: 401,
    message: 'Invalid credentials',
    code: 'INVALID_CREDENTIALS',
  },
  [GRPC_STATUS_CODES.ALREADY_EXISTS]: {
    status: 409,
    message: 'User already exists',
    code: 'USER_EXISTS',
  },
  [GRPC_STATUS_CODES.UNAUTHENTICATED]: {
    status: 401,
    message: 'Invalid refresh token',
    code: 'INVALID_REFRESH_TOKEN',
  },
};

/**
 * User Service Error Mapping
 */
export const USER_ERROR_MAPPING = {
  ...DEFAULT_ERROR_MAPPING,
  [GRPC_STATUS_CODES.NOT_FOUND]: {
    status: 404,
    message: 'User not found',
    code: 'USER_NOT_FOUND',
  },
  [GRPC_STATUS_CODES.INVALID_ARGUMENT]: {
    status: 400,
    message: 'Invalid user data',
    code: 'INVALID_USER_DATA',
  },
  [GRPC_STATUS_CODES.ALREADY_EXISTS]: {
    status: 409,
    message: 'User profile already exists',
    code: 'PROFILE_EXISTS',
  },
};

/**
 * Event Service Error Mapping
 */
export const EVENT_ERROR_MAPPING = {
  ...DEFAULT_ERROR_MAPPING,
  [GRPC_STATUS_CODES.NOT_FOUND]: {
    status: 404,
    message: 'Event not found',
    code: 'EVENT_NOT_FOUND',
  },
  [GRPC_STATUS_CODES.INVALID_ARGUMENT]: {
    status: 400,
    message: 'Invalid event data',
    code: 'INVALID_EVENT_DATA',
  },
  [GRPC_STATUS_CODES.FAILED_PRECONDITION]: {
    status: 400,
    message: 'Event cannot be created/updated',
    code: 'EVENT_OPERATION_FAILED',
  },
};

/**
 * Booking Service Error Mapping
 */
export const BOOKING_ERROR_MAPPING = {
  ...DEFAULT_ERROR_MAPPING,
  [GRPC_STATUS_CODES.NOT_FOUND]: {
    status: 404,
    message: 'Booking not found',
    code: 'BOOKING_NOT_FOUND',
  },
  [GRPC_STATUS_CODES.INVALID_ARGUMENT]: {
    status: 400,
    message: 'Invalid booking data',
    code: 'INVALID_BOOKING_DATA',
  },
  [GRPC_STATUS_CODES.FAILED_PRECONDITION]: {
    status: 400,
    message: 'Booking cannot be cancelled',
    code: 'BOOKING_CANCELLATION_FAILED',
  },
  [GRPC_STATUS_CODES.ALREADY_EXISTS]: {
    status: 409,
    message: 'Booking already exists',
    code: 'BOOKING_EXISTS',
  },
};

/**
 * Payment Service Error Mapping
 */
export const PAYMENT_ERROR_MAPPING = {
  ...DEFAULT_ERROR_MAPPING,
  [GRPC_STATUS_CODES.NOT_FOUND]: {
    status: 404,
    message: 'Payment not found',
    code: 'PAYMENT_NOT_FOUND',
  },
  [GRPC_STATUS_CODES.INVALID_ARGUMENT]: {
    status: 400,
    message: 'Invalid payment data',
    code: 'INVALID_PAYMENT_DATA',
  },
  [GRPC_STATUS_CODES.FAILED_PRECONDITION]: {
    status: 400,
    message: 'Payment cannot be refunded',
    code: 'PAYMENT_REFUND_FAILED',
  },
  [GRPC_STATUS_CODES.ABORTED]: {
    status: 402,
    message: 'Payment failed',
    code: 'PAYMENT_FAILED',
  },
  [GRPC_STATUS_CODES.PERMISSION_DENIED]: {
    status: 403,
    message: 'Payment access denied',
    code: 'PAYMENT_ACCESS_DENIED',
  },
};

/**
 * Get error mapping for a specific service
 * @param {string} serviceName - Service name (auth, user, event, booking, payment)
 * @returns {Object} Error mapping object
 */
export const getErrorMapping = (serviceName) => {
  const mappings = {
    auth: AUTH_ERROR_MAPPING,
    user: USER_ERROR_MAPPING,
    event: EVENT_ERROR_MAPPING,
    booking: BOOKING_ERROR_MAPPING,
    payment: PAYMENT_ERROR_MAPPING,
  };

  return mappings[serviceName.toLowerCase()] || DEFAULT_ERROR_MAPPING;
};

/**
 * Get error info by gRPC code and service
 * @param {number} grpcCode - gRPC status code
 * @param {string} serviceName - Service name
 * @returns {Object} Error info with status, message, and code
 */
export const getErrorInfo = (grpcCode, serviceName) => {
  const mapping = getErrorMapping(serviceName);
  return (
    mapping[grpcCode] ||
    DEFAULT_ERROR_MAPPING[grpcCode] || {
      status: 500,
      message: 'Internal server error',
      code: 'UNKNOWN_ERROR',
    }
  );
};

export { GRPC_STATUS_CODES };
