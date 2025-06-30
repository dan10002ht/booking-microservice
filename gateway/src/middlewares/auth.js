import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import logger from '../utils/logger.js';

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
        correlationId: req.correlationId
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Add user info to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || []
    };

    // Add correlation ID to response headers
    if (req.correlationId) {
      res.setHeader('X-Correlation-ID', req.correlationId);
    }

    logger.info('Authentication successful', {
      userId: req.user.id,
      email: req.user.email,
      correlationId: req.correlationId
    });

    next();
  } catch (error) {
    logger.error('Authentication failed', {
      error: error.message,
      correlationId: req.correlationId
    });

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired',
        correlationId: req.correlationId
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
        correlationId: req.correlationId
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
      correlationId: req.correlationId
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwt.secret);
      
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || []
      };
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        correlationId: req.correlationId
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        correlationId: req.correlationId
      });
    }

    next();
  };
};

// Permission-based authorization middleware
const requirePermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        correlationId: req.correlationId
      });
    }

    const hasPermission = permissions.some(permission => 
      req.user.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        correlationId: req.correlationId
      });
    }

    next();
  };
};

export { authMiddleware, optionalAuthMiddleware, requireRole, requirePermission };
export default authMiddleware; 