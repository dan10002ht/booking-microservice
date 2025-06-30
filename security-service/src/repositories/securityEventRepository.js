import db from '../config/database.js';
import logger from '../utils/logger.js';

class SecurityEventRepository {
  /**
   * Create a new security event
   */
  async create(eventData) {
    try {
      const [event] = await db('security_events')
        .insert({
          user_id: eventData.user_id,
          service_name: eventData.service_name,
          event_type: eventData.event_type,
          event_category: eventData.event_category,
          severity: eventData.severity,
          event_data: eventData.event_data,
          ip_address: eventData.ip_address,
          user_agent: eventData.user_agent,
          location_data: eventData.location_data,
          risk_score: eventData.risk_score || 0,
        })
        .returning('*');

      logger.info(`Security event created: ${event.id}`);
      return event;
    } catch (error) {
      logger.error('Error creating security event:', error);
      throw error;
    }
  }

  /**
   * Get security events with filters
   */
  async find(filters = {}, pagination = {}) {
    try {
      let query = db('security_events')
        .select('*')
        .orderBy('created_at', 'desc');

      // Apply filters
      if (filters.user_id) {
        query = query.where('user_id', filters.user_id);
      }
      if (filters.service_name) {
        query = query.where('service_name', filters.service_name);
      }
      if (filters.event_type) {
        query = query.where('event_type', filters.event_type);
      }
      if (filters.severity) {
        query = query.where('severity', filters.severity);
      }
      if (filters.start_date) {
        query = query.where('created_at', '>=', filters.start_date);
      }
      if (filters.end_date) {
        query = query.where('created_at', '<=', filters.end_date);
      }
      if (filters.is_processed !== undefined) {
        query = query.where('is_processed', filters.is_processed);
      }

      // Apply pagination
      if (pagination.page && pagination.limit) {
        const offset = (pagination.page - 1) * pagination.limit;
        query = query.offset(offset).limit(pagination.limit);
      }

      const events = await query;
      return events;
    } catch (error) {
      logger.error('Error finding security events:', error);
      throw error;
    }
  }

  /**
   * Get event by ID
   */
  async findById(id) {
    try {
      const [event] = await db('security_events')
        .where('id', id)
        .select('*');

      return event;
    } catch (error) {
      logger.error('Error finding security event by ID:', error);
      throw error;
    }
  }

  /**
   * Update event
   */
  async update(id, updateData) {
    try {
      const [event] = await db('security_events')
        .where('id', id)
        .update({
          ...updateData,
          updated_at: new Date(),
        })
        .returning('*');

      logger.info(`Security event updated: ${id}`);
      return event;
    } catch (error) {
      logger.error('Error updating security event:', error);
      throw error;
    }
  }

  /**
   * Mark event as processed
   */
  async markAsProcessed(id) {
    try {
      const [event] = await db('security_events')
        .where('id', id)
        .update({
          is_processed: true,
          processed_at: new Date(),
        })
        .returning('*');

      logger.info(`Security event marked as processed: ${id}`);
      return event;
    } catch (error) {
      logger.error('Error marking security event as processed:', error);
      throw error;
    }
  }

  /**
   * Get unprocessed events
   */
  async getUnprocessedEvents(limit = 100) {
    try {
      const events = await db('security_events')
        .where('is_processed', false)
        .orderBy('created_at', 'asc')
        .limit(limit)
        .select('*');

      return events;
    } catch (error) {
      logger.error('Error getting unprocessed events:', error);
      throw error;
    }
  }

  /**
   * Get events by user ID
   */
  async getEventsByUserId(userId, limit = 50) {
    try {
      const events = await db('security_events')
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .select('*');

      return events;
    } catch (error) {
      logger.error('Error getting events by user ID:', error);
      throw error;
    }
  }

  /**
   * Get high severity events
   */
  async getHighSeverityEvents(hours = 24) {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const events = await db('security_events')
        .whereIn('severity', ['high', 'critical'])
        .where('created_at', '>=', cutoffTime)
        .orderBy('created_at', 'desc')
        .select('*');

      return events;
    } catch (error) {
      logger.error('Error getting high severity events:', error);
      throw error;
    }
  }

  /**
   * Delete old events
   */
  async deleteOldEvents(days = 365) {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const result = await db('security_events')
        .where('created_at', '<', cutoffDate)
        .del();

      logger.info(`Deleted ${result} old security events`);
      return result;
    } catch (error) {
      logger.error('Error deleting old events:', error);
      throw error;
    }
  }
}

export default new SecurityEventRepository(); 