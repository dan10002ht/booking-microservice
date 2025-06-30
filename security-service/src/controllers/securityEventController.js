import securityEventService from '../services/securityEventService.js';
import logger from '../utils/logger.js';

/**
 * Submit a security event
 */
const submitEvent = async (call, callback) => {
  try {
    const {
      user_id,
      service_name,
      event_type,
      event_category,
      severity,
      event_data,
      ip_address,
      user_agent,
      location_data,
    } = call.request;

    // Validate required fields
    if (!service_name || !event_type || !event_category || !severity) {
      return callback({
        code: 3, // INVALID_ARGUMENT
        message: 'Missing required fields: service_name, event_type, event_category, severity',
      });
    }

    const eventData = {
      user_id,
      service_name,
      event_type,
      event_category,
      severity,
      event_data: event_data ? JSON.parse(event_data.toString()) : {},
      ip_address,
      user_agent,
      location_data: location_data ? JSON.parse(location_data.toString()) : {},
    };

    const result = await securityEventService.submitEvent(eventData);

    logger.info(`Security event submitted: ${result.event_id}`);

    callback(null, {
      success: result.success,
      event_id: result.event_id,
      message: result.message,
    });
  } catch (error) {
    logger.error('Error in submitEvent controller:', error);
    callback({
      code: 13, // INTERNAL
      message: error.message,
    });
  }
};

/**
 * Get security events
 */
const getEvents = async (call, callback) => {
  try {
    const {
      user_id,
      service_name,
      event_type,
      severity,
      start_date,
      end_date,
      page,
      limit,
    } = call.request;

    const filters = {};
    if (user_id) filters.user_id = user_id;
    if (service_name) filters.service_name = service_name;
    if (event_type) filters.event_type = event_type;
    if (severity) filters.severity = severity;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const pagination = {
      page: page || 1,
      limit: limit || 50,
    };

    const result = await securityEventService.getEvents(filters, pagination);

    callback(null, {
      success: result.success,
      events: result.events.map(event => ({
        id: event.id,
        user_id: event.user_id,
        service_name: event.service_name,
        event_type: event.event_type,
        event_category: event.event_category,
        severity: event.severity,
        event_data: Buffer.from(JSON.stringify(event.event_data)),
        ip_address: event.ip_address,
        user_agent: event.user_agent,
        location_data: Buffer.from(JSON.stringify(event.location_data || {})),
        risk_score: event.risk_score,
        is_processed: event.is_processed,
        created_at: event.created_at.toISOString(),
        processed_at: event.processed_at ? event.processed_at.toISOString() : '',
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      message: result.message,
    });
  } catch (error) {
    logger.error('Error in getEvents controller:', error);
    callback({
      code: 13, // INTERNAL
      message: error.message,
    });
  }
};

export default {
  submitEvent,
  getEvents,
}; 