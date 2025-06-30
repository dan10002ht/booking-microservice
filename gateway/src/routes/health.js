import express from 'express';
import circuitBreakerService from '../services/circuitBreakerService.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    service: 'gateway',
    correlationId: req.correlationId,
  };

  logger.info('Health check requested', {
    correlationId: req.correlationId,
  });

  res.status(200).json(healthData);
});

router.get('/ready', (req, res) => {
  const readinessData = {
    status: 'ready',
    timestamp: new Date().toISOString(),
    service: 'gateway',
    correlationId: req.correlationId,
  };

  logger.info('Readiness check requested', {
    correlationId: req.correlationId,
  });

  res.status(200).json(readinessData);
});

router.get('/live', (req, res) => {
  const livenessData = {
    status: 'alive',
    timestamp: new Date().toISOString(),
    service: 'gateway',
    correlationId: req.correlationId,
  };

  logger.info('Liveness check requested', {
    correlationId: req.correlationId,
  });

  res.status(200).json(livenessData);
});

// Circuit breaker stats endpoint
router.get('/circuit-breaker-stats', (req, res) => {
  try {
    const stats = circuitBreakerService.getStats();
    const health = circuitBreakerService.getHealth();

    res.json({
      success: true,
      stats,
      health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get circuit breaker stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get circuit breaker stats',
    });
  }
});

// Circuit breaker reset endpoint
router.post('/reset-circuit-breakers', (req, res) => {
  try {
    const { service } = req.body;

    if (service) {
      // Reset specific service breakers
      const breakers = circuitBreakerService.breakers;
      let resetCount = 0;

      for (const [name, breaker] of breakers) {
        if (name.startsWith(service + '.')) {
          breaker.close();
          resetCount++;
        }
      }

      logger.info(`Reset ${resetCount} circuit breakers for service: ${service}`);
      res.json({
        success: true,
        message: `Reset ${resetCount} circuit breakers for service: ${service}`,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Reset all breakers
      circuitBreakerService.resetAllBreakers();
      res.json({
        success: true,
        message: 'All circuit breakers reset',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Failed to reset circuit breakers', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to reset circuit breakers',
    });
  }
});

export default router;
