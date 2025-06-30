/**
 * @swagger
 * components:
 *   schemas:
 *     HealthStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [healthy, unhealthy]
 *           description: Overall health status
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Current timestamp
 *         uptime:
 *           type: number
 *           description: Service uptime in seconds
 *         version:
 *           type: string
 *           description: Service version
 *         service:
 *           type: string
 *           description: Service name
 *         correlationId:
 *           type: string
 *           description: Request correlation ID
 *         checks:
 *           type: object
 *           description: Individual health checks
 *           properties:
 *             database:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *                 responseTime:
 *                   type: number
 *                   description: Response time in milliseconds
 *             redis:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *                 responseTime:
 *                   type: number
 *                   description: Response time in milliseconds
 *             externalServices:
 *               type: object
 *               properties:
 *                 auth:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                     responseTime:
 *                       type: number
 *                       description: Response time in milliseconds
 *                 booking:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                     responseTime:
 *                       type: number
 *                       description: Response time in milliseconds
 *                 payment:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                     responseTime:
 *                       type: number
 *                       description: Response time in milliseconds
 *     ReadinessStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [ready, not_ready]
 *           description: Readiness status
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Current timestamp
 *         service:
 *           type: string
 *           description: Service name
 *         correlationId:
 *           type: string
 *           description: Request correlation ID
 *         dependencies:
 *           type: object
 *           description: Dependency readiness status
 *           properties:
 *             database:
 *               type: boolean
 *               description: Database connection status
 *             redis:
 *               type: boolean
 *               description: Redis connection status
 *             externalServices:
 *               type: object
 *               properties:
 *                 auth:
 *                   type: boolean
 *                   description: Auth service connection status
 *                 booking:
 *                   type: boolean
 *                   description: Booking service connection status
 *                 payment:
 *                   type: boolean
 *                   description: Payment service connection status
 *     LivenessStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [alive, dead]
 *           description: Liveness status
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Current timestamp
 *         service:
 *           type: string
 *           description: Service name
 *         correlationId:
 *           type: string
 *           description: Request correlation ID
 *         memory:
 *           type: object
 *           description: Memory usage information
 *           properties:
 *             used:
 *               type: number
 *               description: Used memory in bytes
 *             total:
 *               type: number
 *               description: Total memory in bytes
 *             percentage:
 *               type: number
 *               description: Memory usage percentage
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the comprehensive health status of the gateway service including all dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 */

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness check endpoint
 *     description: Returns the readiness status of the gateway service and its dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready to accept traffic
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReadinessStatus'
 *       503:
 *         description: Service is not ready
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReadinessStatus'
 */

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness check endpoint
 *     description: Returns the liveness status of the gateway service
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive and running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LivenessStatus'
 *       503:
 *         description: Service is not alive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LivenessStatus'
 */

export default {};
