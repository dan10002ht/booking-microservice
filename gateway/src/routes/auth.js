import express from 'express';
import {
  registerWithEmailHandler,
  registerWithOAuthHandler,
  loginHandler,
  refreshTokenHandler,
  logoutHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
} from '../handlers/index.js';
import {
  validateRegistration,
  validateLogin,
  validateRefreshToken,
  validateOAuthRegistration,
  validateForgotPassword,
  validateResetPassword,
} from '../middlewares/index.js';

const router = express.Router();

// Registration endpoints
router.post('/register/email', validateRegistration, registerWithEmailHandler);
router.post('/register/oauth', validateOAuthRegistration, registerWithOAuthHandler);
router.post('/register/test/google/callback', (req, res) => {
  return res.status(200).json(req.body);
});

// Login endpoints
router.post('/login', validateLogin, loginHandler);

// Password management
router.post('/forgot-password', validateForgotPassword, forgotPasswordHandler);
router.post('/reset-password', validateResetPassword, resetPasswordHandler);

// Token management
router.post('/refresh', validateRefreshToken, refreshTokenHandler);
router.post('/logout', logoutHandler);

// Health check
router.get('/hello', (req, res) => {
  res.send('Hello World');
});

export default router;
