import promBundle from 'express-prom-bundle';

/**
 * Initialize Prometheus metrics middleware
 * @returns {Function} Express middleware for metrics
 */
export const initializeMetrics = () => {
  return promBundle({
    includeMethod: true,
    includePath: true,
    promClient: {
      collectDefaultMetrics: {},
    },
  });
};
