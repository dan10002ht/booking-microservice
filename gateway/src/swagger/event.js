/**
 * @swagger
 * components:
 *   schemas:
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
 *         category:
 *           type: string
 *           description: Event category
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
 *         address:
 *           type: string
 *           description: Event address
 *         city:
 *           type: string
 *           description: Event city
 *         country:
 *           type: string
 *           description: Event country
 *         price:
 *           type: number
 *           description: Ticket price
 *         availableTickets:
 *           type: integer
 *           description: Number of available tickets
 *         totalTickets:
 *           type: integer
 *           description: Total number of tickets
 *         status:
 *           type: string
 *           enum: [draft, published, cancelled, completed]
 *           description: Event status
 *         organizerId:
 *           type: string
 *           description: Organizer ID
 *         organizerName:
 *           type: string
 *           description: Organizer name
 *         imageUrl:
 *           type: string
 *           description: Event image URL
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Event tags
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Event creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update date
 *     EventCreate:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - startDate
 *         - endDate
 *         - location
 *         - price
 *         - totalTickets
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 200
 *           description: Event title
 *         description:
 *           type: string
 *           minLength: 10
 *           description: Event description
 *         category:
 *           type: string
 *           description: Event category
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
 *         address:
 *           type: string
 *           description: Event address
 *         city:
 *           type: string
 *           description: Event city
 *         country:
 *           type: string
 *           description: Event country
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Ticket price
 *         totalTickets:
 *           type: integer
 *           minimum: 1
 *           description: Total number of tickets
 *         imageUrl:
 *           type: string
 *           description: Event image URL
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Event tags
 *     EventUpdate:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 200
 *           description: Event title
 *         description:
 *           type: string
 *           minLength: 10
 *           description: Event description
 *         category:
 *           type: string
 *           description: Event category
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
 *         address:
 *           type: string
 *           description: Event address
 *         city:
 *           type: string
 *           description: Event city
 *         country:
 *           type: string
 *           description: Event country
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Ticket price
 *         totalTickets:
 *           type: integer
 *           minimum: 1
 *           description: Total number of tickets
 *         imageUrl:
 *           type: string
 *           description: Event image URL
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Event tags
 */

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events
 *     description: Retrieve all available events with optional filtering
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by event category
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by event location
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by event date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, cancelled, completed]
 *         description: Filter by event status
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
 *         description: Events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
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
 */

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create new event
 *     description: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventCreate'
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /events/{eventId}:
 *   get:
 *     summary: Get event by ID
 *     description: Retrieve a specific event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /events/{eventId}:
 *   put:
 *     summary: Update event
 *     description: Update an existing event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventUpdate'
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 *       403:
 *         description: Forbidden - not the event organizer
 */

/**
 * @swagger
 * /events/{eventId}:
 *   delete:
 *     summary: Delete event
 *     description: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 *       403:
 *         description: Forbidden - not the event organizer
 */

export default {};
