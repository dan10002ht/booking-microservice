import express from 'express';

// Import handlers
import {
  getEventsHandler,
  getEventHandler,
  createEventHandler,
  updateEventHandler,
  deleteEventHandler,
} from '../handlers/index.js';

const router = express.Router();

router.get('/', getEventsHandler);

router.post('/', createEventHandler);

router.get('/:eventId', getEventHandler);

router.put('/:eventId', updateEventHandler);

router.delete('/:eventId', deleteEventHandler);

export default router;
