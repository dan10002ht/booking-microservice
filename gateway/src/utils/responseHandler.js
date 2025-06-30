import { validationResult } from 'express-validator';
import logger from './logger.js';
import { getErrorMapping, getErrorInfo } from './errorMapping.js';

/**
 * Handle validation errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {boolean} True if validation passed, false if failed
 */
export const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      details: errors.array(),
      correlationId: req.correlationId,
    });
    return false;
  }
  return true;
};

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Response data
 * @param {string} correlationId - Correlation ID
 */
export const sendSuccessResponse = (res, statusCode, data, correlationId) => {
  res.status(statusCode).json({
    ...data,
    correlationId,
  });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} error - Error message
 * @param {string} correlationId - Correlation ID
 * @param {Object} details - Additional error details
 * @param {string} code - Error code
 */
export const sendErrorResponse = (
  res,
  statusCode,
  error,
  correlationId,
  details = null,
  code = null
) => {
  const response = {
    error,
    correlationId,
  };

  if (code) {
    response.code = code;
  }

  if (details) {
    response.details = details;
  }

  res.status(statusCode).json(response);
};

/**
 * Handle gRPC errors and map to HTTP status codes
 * @param {Object} res - Express response object
 * @param {Error} error - gRPC error
 * @param {string} correlationId - Correlation ID
 * @param {string} serviceName - Service name for logging
 * @param {string} methodName - Method name for logging
 * @param {Object} customErrorMapping - Custom error mapping (optional)
 */
export const handleGrpcError = (
  res,
  error,
  correlationId,
  serviceName,
  methodName,
  customErrorMapping = {}
) => {
  // Log error
  logger.error(`${serviceName} ${methodName} error`, {
    error: error.message,
    code: error.code,
    correlationId,
  });

  // Get error mapping for the service
  const serviceErrorMapping = getErrorMapping(serviceName);

  // Merge with custom mapping (custom mapping takes precedence)
  const mapping = { ...serviceErrorMapping, ...customErrorMapping };

  const errorInfo = mapping[error.code] || {
    status: 500,
    message: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
  };

  sendErrorResponse(res, errorInfo.status, errorInfo.message, correlationId, null, errorInfo.code);
};

/**
 * Create a handler wrapper with common error handling
 * @param {Function} handler - The handler function
 * @param {string} serviceName - Service name for logging
 * @param {string} methodName - Method name for logging
 * @param {Object} customErrorMapping - Custom error mapping (optional)
 * @returns {Function} Wrapped handler function
 */
export const createHandler = (handler, serviceName, methodName, customErrorMapping = {}) => {
  return async (req, res) => {
    try {
      // Handle validation if needed
      if (!handleValidation(req, res)) {
        return;
      }

      // Call the actual handler
      await handler(req, res);
    } catch (error) {
      console.log('error', error);
      handleGrpcError(res, error, req.correlationId, serviceName, methodName, customErrorMapping);
    }
  };
};

/**
 * Create a simple handler wrapper (without validation)
 * @param {Function} handler - The handler function
 * @param {string} serviceName - Service name for logging
 * @param {string} methodName - Method name for logging
 * @param {Object} customErrorMapping - Custom error mapping (optional)
 * @returns {Function} Wrapped handler function
 */
export const createSimpleHandler = (handler, serviceName, methodName, customErrorMapping = {}) => {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleGrpcError(res, error, req.correlationId, serviceName, methodName, customErrorMapping);
    }
  };
};
