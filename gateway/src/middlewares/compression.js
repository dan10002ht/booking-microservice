import compression from 'compression';

/**
 * Compression middleware configuration
 */
export const compressionMiddleware = (app) => {
  // Enable gzip compression for all responses
  app.use(compression({
    // Only compress responses larger than 1KB
    threshold: 1024,
    // Don't compress responses with these content types
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    // Compression level (0-9, higher = more compression but slower)
    level: 6
  }));
}; 