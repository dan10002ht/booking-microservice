import grpcClients from '../grpc/clients.js';
import { sendSuccessResponse, createSimpleHandler } from '../utils/responseHandler.js';

/**
 * Get all events
 */
const getAllEvents = async (req, res) => {
  const result = await grpcClients.eventService.getEvents({
    category: req.query.category,
    location: req.query.location,
    date: req.query.date,
  });
  sendSuccessResponse(res, 200, result, req.correlationId);
};

/**
 * Get event by ID
 */
const getEventById = async (req, res) => {
  const result = await grpcClients.eventService.getEvent({
    eventId: req.params.eventId,
  });
  sendSuccessResponse(res, 200, result, req.correlationId);
};

/**
 * Create new event
 */
const createNewEvent = async (req, res) => {
  const result = await grpcClients.eventService.createEvent(req.body);
  sendSuccessResponse(res, 201, result, req.correlationId);
};

/**
 * Update event
 */
const updateEvent = async (req, res) => {
  const result = await grpcClients.eventService.updateEvent({
    eventId: req.params.eventId,
    ...req.body,
  });
  sendSuccessResponse(res, 200, result, req.correlationId);
};

/**
 * Delete event
 */
const deleteEvent = async (req, res) => {
  await grpcClients.eventService.deleteEvent({
    eventId: req.params.eventId,
  });
  sendSuccessResponse(res, 200, { message: 'Event deleted successfully' }, req.correlationId);
};

export const getEventsHandler = createSimpleHandler(getAllEvents, 'event', 'getEvents');
export const getEventHandler = createSimpleHandler(getEventById, 'event', 'getEvent');
export const createEventHandler = createSimpleHandler(createNewEvent, 'event', 'createEvent');
export const updateEventHandler = createSimpleHandler(updateEvent, 'event', 'updateEvent');
export const deleteEventHandler = createSimpleHandler(deleteEvent, 'event', 'deleteEvent');
