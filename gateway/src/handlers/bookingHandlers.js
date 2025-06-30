import grpcClients from '../grpc/clients.js';
import {
  sendSuccessResponse,
  createHandler,
  createSimpleHandler,
} from '../utils/responseHandler.js';

/**
 * Create a new booking
 */
const createNewBooking = async (req, res) => {
  const result = await grpcClients.bookingService.createBooking({
    userId: req.user.id,
    ...req.body,
  });
  sendSuccessResponse(res, 201, result, req.correlationId);
};

/**
 * Get booking by ID
 */
const getBookingById = async (req, res) => {
  const result = await grpcClients.bookingService.getBooking({
    bookingId: req.params.bookingId,
    userId: req.user.id,
  });
  sendSuccessResponse(res, 200, result, req.correlationId);
};

/**
 * Get user bookings
 */
const getUserBookings = async (req, res) => {
  const result = await grpcClients.bookingService.getUserBookings({
    userId: req.user.id,
    status: req.query.status,
    limit: req.query.limit,
    offset: req.query.offset,
  });
  sendSuccessResponse(res, 200, result, req.correlationId);
};

/**
 * Cancel booking
 */
const cancelUserBooking = async (req, res) => {
  const result = await grpcClients.bookingService.cancelBooking({
    bookingId: req.params.bookingId,
    userId: req.user.id,
  });
  sendSuccessResponse(res, 200, result, req.correlationId);
};

/**
 * Update booking
 */
const updateUserBooking = async (req, res) => {
  const result = await grpcClients.bookingService.updateBooking({
    bookingId: req.params.bookingId,
    userId: req.user.id,
    ...req.body,
  });
  sendSuccessResponse(res, 200, result, req.correlationId);
};

// Export wrapped handlers
export const createBookingHandler = createHandler(createNewBooking, 'booking', 'createBooking');
export const getBookingHandler = createSimpleHandler(getBookingById, 'booking', 'getBooking');
export const getUserBookingsHandler = createSimpleHandler(
  getUserBookings,
  'booking',
  'getUserBookings'
);
export const cancelBookingHandler = createSimpleHandler(
  cancelUserBooking,
  'booking',
  'cancelBooking'
);
export const updateBookingHandler = createHandler(updateUserBooking, 'booking', 'updateBooking');
