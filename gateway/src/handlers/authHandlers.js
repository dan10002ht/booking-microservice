import grpcClients from '../grpc/clients.js';
import {
  sendSuccessResponse,
  createHandler,
  createSimpleHandler,
} from '../utils/responseHandler.js';

/**
 * Register a new user with email and password
 */
const registerUserWithEmail = async (req, res) => {
  const requestData = {
    ...req.body,
    ip_address: req.ip || req.connection.remoteAddress,
    user_agent: req.get('User-Agent'),
  };

  const result = await grpcClients.authService.registerWithEmail(requestData);
  sendSuccessResponse(res, 201, result, req.correlationId);
};

/**
 * Register a new user with OAuth (Google, Facebook, etc.)
 */
const registerUserWithOAuth = async (req, res) => {
  const requestData = {
    ...req.body,
    ip_address: req.ip || req.connection.remoteAddress,
    user_agent: req.get('User-Agent'),
  };

  const result = await grpcClients.authService.registerWithOAuth(requestData);
  sendSuccessResponse(res, 201, result, req.correlationId);
};

/**
 * User login
 */
const loginUser = async (req, res) => {
  const requestData = {
    ...req.body,
    ip_address: req.ip || req.connection.remoteAddress,
    user_agent: req.get('User-Agent'),
  };

  const result = await grpcClients.authService.login(requestData);
  sendSuccessResponse(res, 200, result, req.correlationId);
};

/**
 * Refresh access token
 */
const refreshUserToken = async (req, res) => {
  const result = await grpcClients.authService.refreshToken(req.body);
  sendSuccessResponse(res, 200, result, req.correlationId);
};

/**
 * User logout
 */
const logoutUser = async (req, res) => {
  await grpcClients.authService.logout({
    refresh_token: req.body.refresh_token,
  });
  sendSuccessResponse(res, 200, { message: 'Logout successful' }, req.correlationId);
};

/**
 * Forgot password - send reset email
 */
const forgotPassword = async (req, res) => {
  const requestData = {
    ...req.body,
    ip_address: req.ip || req.connection.remoteAddress,
    user_agent: req.get('User-Agent'),
  };

  const result = await grpcClients.authService.forgotPassword(requestData);
  sendSuccessResponse(res, 200, result, req.correlationId);
};

/**
 * Reset password with token
 */
const resetPassword = async (req, res) => {
  const requestData = {
    ...req.body,
    ip_address: req.ip || req.connection.remoteAddress,
    user_agent: req.get('User-Agent'),
  };

  const result = await grpcClients.authService.resetPassword(requestData);
  sendSuccessResponse(res, 200, result, req.correlationId);
};

// Export wrapped handlers
export const registerWithEmailHandler = createHandler(
  registerUserWithEmail,
  'auth',
  'registerWithEmail'
);
export const registerWithOAuthHandler = createHandler(
  registerUserWithOAuth,
  'auth',
  'registerWithOAuth'
);
export const loginHandler = createHandler(loginUser, 'auth', 'login');
export const refreshTokenHandler = createHandler(refreshUserToken, 'auth', 'refreshToken');
export const logoutHandler = createSimpleHandler(logoutUser, 'auth', 'logout');
export const forgotPasswordHandler = createHandler(forgotPassword, 'auth', 'forgotPassword');
export const resetPasswordHandler = createHandler(resetPassword, 'auth', 'resetPassword');
