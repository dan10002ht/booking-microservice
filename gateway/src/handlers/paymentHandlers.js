import { validationResult } from 'express-validator';
import logger from '../utils/logger.js';
import grpcClients from '../grpc/clients.js';
import { sendSuccessResponse, createHandler, createSimpleHandler } from '../utils/responseHandler.js';

/**
 * Process payment
 */
const processUserPayment = async (req, res) => {
  const result = await grpcClients.paymentService.processPayment({
    userId: req.user.id,
    ...req.body
  });
  sendSuccessResponse(res, 200, result, req.correlationId);
};

/**
 * Get payment by ID
 */
const getPaymentById = async (req, res) => {
  const result = await grpcClients.paymentService.getPayment({
    paymentId: req.params.paymentId,
    userId: req.user.id
  });
  sendSuccessResponse(res, 200, result, req.correlationId);
};

/**
 * Get user payments
 */
const getUserPayments = async (req, res) => {
  const result = await grpcClients.paymentService.getUserPayments({
    userId: req.user.id,
    status: req.query.status,
    limit: req.query.limit,
    offset: req.query.offset
  });
  sendSuccessResponse(res, 200, result, req.correlationId);
};

/**
 * Refund payment
 */
const refundUserPayment = async (req, res) => {
  const result = await grpcClients.paymentService.refundPayment({
    paymentId: req.params.paymentId,
    userId: req.user.id,
    reason: req.body.reason
  });
  sendSuccessResponse(res, 200, result, req.correlationId);
};

/**
 * Get payment methods
 */
const getPaymentMethods = async (req, res) => {
  const result = await grpcClients.paymentService.getPaymentMethods({
    userId: req.user.id
  });
  sendSuccessResponse(res, 200, result, req.correlationId);
};

/**
 * Add payment method
 */
const addPaymentMethod = async (req, res) => {
  const result = await grpcClients.paymentService.addPaymentMethod({
    userId: req.user.id,
    ...req.body
  });
  sendSuccessResponse(res, 201, result, req.correlationId);
};

// Export wrapped handlers
export const processPaymentHandler = createHandler(processUserPayment, 'payment', 'processPayment');
export const getPaymentHandler = createSimpleHandler(getPaymentById, 'payment', 'getPayment');
export const getUserPaymentsHandler = createSimpleHandler(getUserPayments, 'payment', 'getUserPayments');
export const refundPaymentHandler = createHandler(refundUserPayment, 'payment', 'refundPayment');
export const getPaymentMethodsHandler = createSimpleHandler(getPaymentMethods, 'payment', 'getPaymentMethods');
export const addPaymentMethodHandler = createHandler(addPaymentMethod, 'payment', 'addPaymentMethod'); 