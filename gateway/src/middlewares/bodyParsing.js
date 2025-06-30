import express from 'express';

/**
 * Body parsing middleware configuration
 */
export const bodyParsingMiddleware = (app) => {
  // Parse application/json
  app.use(express.json({ limit: '10mb' }));
  
  // Parse application/x-www-form-urlencoded
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Parse text/plain
  app.use(express.text({ limit: '10mb' }));
  
  // Parse application/octet-stream
  app.use(express.raw({ limit: '10mb' }));
}; 