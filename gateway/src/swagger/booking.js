/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Booking ID
 *         userId:
 *           type: string
 *           description: User ID
 *         eventId:
 *           type: string
 *           description: Event ID
 *         ticketQuantity:
 *           type: integer
 *           minimum: 1
 *           description: Number of tickets
 *         totalAmount:
 *           type: number
 *           description: Total booking amount
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *           description: Booking status
 *         specialRequests:
 *           type: string
 *           description: Special requests for the booking
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Booking creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update date
 *         event:
 *           $ref: '#/components/schemas/Event'
 *     BookingCreate:
 *       type: object
 *       required:
 *         - eventId
 *         - ticketQuantity
 *       properties:
 *         eventId:
 *           type: string
 *           description: Event ID
 *         ticketQuantity:
 *           type: integer
 *           minimum: 1
 *           description: Number of tickets
 *         specialRequests:
 *           type: string
 *           description: Special requests for the booking
 *     Event:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Event ID
 *         title:
 *           type: string
 *           description: Event title
 *         description:
 *           type: string
 *           description: Event description
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Event start date
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Event end date
 *         location:
 *           type: string
 *           description: Event location
 *         price:
 *           type: number
 *           description: Ticket price
 *         availableTickets:
 *           type: integer
 *           description: Number of available tickets
 *         status:
 *           type: string
 *           enum: [draft, published, cancelled, completed]
 *           description: Event status
 */

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     description: Create a new booking for an event
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingCreate'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Validation error or insufficient tickets
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get user bookings
 *     description: Retrieve all bookings for the current user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *         description: Filter by booking status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /bookings/{bookingId}:
 *   get:
 *     summary: Get booking by ID
 *     description: Retrieve a specific booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */

/**
 * @swagger
 * /bookings/{bookingId}/cancel:
 *   post:
 *     summary: Cancel booking
 *     description: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Booking cannot be cancelled
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */

export default {};
