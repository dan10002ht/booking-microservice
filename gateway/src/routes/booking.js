import express from 'express';
import { body } from 'express-validator';

// Import handlers
import {
  createBookingHandler,
  getUserBookingsHandler,
  getBookingHandler,
  cancelBookingHandler,
} from '../handlers/index.js';

const router = express.Router();

router.post(
  '/',
  [
    body('eventId').notEmpty().trim(),
    body('ticketQuantity').isInt({ min: 1 }),
    body('specialRequests').optional().trim(),
  ],
  createBookingHandler
);

router.get('/', getUserBookingsHandler);

router.get('/:bookingId', getBookingHandler);

router.post('/:bookingId/cancel', cancelBookingHandler);

export default router;
