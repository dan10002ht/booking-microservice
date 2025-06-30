/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Payment ID
 *         bookingId:
 *           type: string
 *           description: Associated booking ID
 *         userId:
 *           type: string
 *           description: User ID
 *         amount:
 *           type: number
 *           description: Payment amount
 *         currency:
 *           type: string
 *           default: USD
 *           description: Payment currency
 *         paymentMethod:
 *           type: string
 *           enum: [credit_card, debit_card, bank_transfer, digital_wallet]
 *           description: Payment method used
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, failed, refunded]
 *           description: Payment status
 *         transactionId:
 *           type: string
 *           description: External transaction ID
 *         gateway:
 *           type: string
 *           description: Payment gateway used
 *         metadata:
 *           type: object
 *           description: Additional payment metadata
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Payment creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update date
 *         booking:
 *           $ref: '#/components/schemas/Booking'
 *     PaymentCreate:
 *       type: object
 *       required:
 *         - bookingId
 *         - amount
 *         - paymentMethod
 *       properties:
 *         bookingId:
 *           type: string
 *           description: Booking ID to pay for
 *         amount:
 *           type: number
 *           minimum: 0.01
 *           description: Payment amount
 *         paymentMethod:
 *           type: string
 *           enum: [credit_card, debit_card, bank_transfer, digital_wallet]
 *           description: Payment method to use
 *         cardNumber:
 *           type: string
 *           description: Credit/debit card number
 *         expiryDate:
 *           type: string
 *           pattern: '^\\d{2}\\/\\d{2}$'
 *           description: Card expiry date (MM/YY)
 *         cvv:
 *           type: string
 *           minLength: 3
 *           maxLength: 4
 *           description: Card CVV
 *         billingAddress:
 *           $ref: '#/components/schemas/UserAddress'
 *     PaymentMethod:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Payment method ID
 *         userId:
 *           type: string
 *           description: User ID
 *         type:
 *           type: string
 *           enum: [credit_card, debit_card, bank_account, digital_wallet]
 *           description: Payment method type
 *         name:
 *           type: string
 *           description: Payment method name
 *         last4:
 *           type: string
 *           description: Last 4 digits of card/account
 *         brand:
 *           type: string
 *           description: Card brand (Visa, Mastercard, etc.)
 *         isDefault:
 *           type: boolean
 *           description: Whether this is the default payment method
 *         expiryDate:
 *           type: string
 *           description: Card expiry date
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation date
 *     PaymentMethodCreate:
 *       type: object
 *       required:
 *         - type
 *         - name
 *       properties:
 *         type:
 *           type: string
 *           enum: [credit_card, debit_card, bank_account, digital_wallet]
 *           description: Payment method type
 *         name:
 *           type: string
 *           description: Payment method name
 *         cardNumber:
 *           type: string
 *           description: Credit/debit card number
 *         expiryDate:
 *           type: string
 *           pattern: '^\\d{2}\\/\\d{2}$'
 *           description: Card expiry date (MM/YY)
 *         cvv:
 *           type: string
 *           minLength: 3
 *           maxLength: 4
 *           description: Card CVV
 *         isDefault:
 *           type: boolean
 *           description: Set as default payment method
 *     RefundRequest:
 *       type: object
 *       required:
 *         - reason
 *       properties:
 *         reason:
 *           type: string
 *           minLength: 3
 *           maxLength: 500
 *           description: Reason for refund
 *         amount:
 *           type: number
 *           description: Partial refund amount (optional for full refund)
 */

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Process payment
 *     description: Process a payment for a booking
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentCreate'
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       402:
 *         description: Payment failed
 *       404:
 *         description: Booking not found
 */

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get payment history
 *     description: Retrieve payment history for the current user
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, refunded]
 *         description: Filter by payment status
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
 *         description: Payment history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
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
 * /payments/methods:
 *   get:
 *     summary: Get payment methods
 *     description: Retrieve user's payment methods
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PaymentMethod'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /payments/methods:
 *   post:
 *     summary: Add payment method
 *     description: Add a new payment method
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentMethodCreate'
 *     responses:
 *       201:
 *         description: Payment method added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentMethod'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /payments/{paymentId}:
 *   get:
 *     summary: Get payment by ID
 *     description: Retrieve a specific payment by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 */

/**
 * @swagger
 * /payments/{paymentId}/refund:
 *   post:
 *     summary: Refund payment
 *     description: Refund a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefundRequest'
 *     responses:
 *       200:
 *         description: Payment refunded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Payment cannot be refunded
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 */

export default {};
