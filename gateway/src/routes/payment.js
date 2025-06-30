import express from 'express';
import { body } from 'express-validator';

// Import handlers
import {
  processPaymentHandler,
  getUserPaymentsHandler,
  getPaymentHandler,
  refundPaymentHandler,
  getPaymentMethodsHandler,
  addPaymentMethodHandler,
} from '../handlers/index.js';

const router = express.Router();

router.post(
  '/',
  [
    body('bookingId').notEmpty().trim(),
    body('amount').isFloat({ min: 0.01 }),
    body('paymentMethod').isIn(['credit_card', 'debit_card', 'bank_transfer']),
    body('cardNumber').optional().isCreditCard(),
    body('expiryDate')
      .optional()
      .matches(/^\d{2}\/\d{2}$/),
    body('cvv').optional().isLength({ min: 3, max: 4 }),
  ],
  processPaymentHandler
);

router.get('/', getUserPaymentsHandler);

router.get('/methods', getPaymentMethodsHandler);

router.post('/methods', addPaymentMethodHandler);

router.get('/:paymentId', getPaymentHandler);

router.post('/:paymentId/refund', [body('reason').notEmpty().trim()], refundPaymentHandler);

export default router;
