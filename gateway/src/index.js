import express from 'express';
import dotenv from 'dotenv';

import config from './config/index.js';
import logger from './utils/logger.js';
import { initializeGateway } from './services/initializeService.js';

dotenv.config();

const app = express();
const PORT = config.server.port;

// Initialize all middleware and routes
initializeGateway(app);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`Gateway server running on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api/docs`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
});

export default app;
