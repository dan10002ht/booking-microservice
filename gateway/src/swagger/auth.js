/**
 * @swagger
 * components:
 *   schemas:
 *     UserRegistration:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - first_name
 *         - last_name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         password:
 *           type: string
 *           minLength: 8
 *           description: User password (min 8 characters)
 *         first_name:
 *           type: string
 *           description: User first name
 *         last_name:
 *           type: string
 *           description: User last name
 *     OAuthRegistration:
 *       type: object
 *       required:
 *         - provider
 *         - token
 *       properties:
 *         provider:
 *           type: string
 *           enum: [google, facebook, github]
 *           description: OAuth provider
 *         token:
 *           type: string
 *           description: OAuth token from provider
 *         access_token:
 *           type: string
 *           description: OAuth access token
 *         refresh_token:
 *           type: string
 *           description: OAuth refresh token
 *         expires_at:
 *           type: integer
 *           description: Token expiration timestamp
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         password:
 *           type: string
 *           description: User password
 *     RefreshToken:
 *       type: object
 *       required:
 *         - refresh_token
 *       properties:
 *         refresh_token:
 *           type: string
 *           description: Refresh token for getting new access token
 *     AuthResponse:
 *       type: object
 *       properties:
 *         access_token:
 *           type: string
 *           description: JWT access token
 *         refresh_token:
 *           type: string
 *           description: JWT refresh token
 *         expires_in:
 *           type: integer
 *           description: Token expiration time in seconds
 *         auth_type:
 *           type: string
 *           enum: [email, oauth]
 *           description: Authentication type
 *         is_new_user:
 *           type: boolean
 *           description: Whether this is a new user (for OAuth)
 */

/**
 * @swagger
 * /auth/register/email:
 *   post:
 *     summary: Register a new user with email and password
 *     description: Create a new user account using email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistration'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */

/**
 * @swagger
 * /auth/register/oauth:
 *   post:
 *     summary: Register a new user with OAuth
 *     description: Create a new user account using OAuth provider (Google, Facebook, GitHub)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OAuthRegistration'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid OAuth token
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return JWT tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get new access token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshToken'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid refresh token
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     description: Invalidate refresh token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /auth/hello:
 *   get:
 *     summary: Hello endpoint
 *     description: Simple hello world endpoint
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Hello message
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Hello World"
 */

export default {};
