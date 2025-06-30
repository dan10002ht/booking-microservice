import securityEventRepository from '../repositories/securityEventRepository.js';
import securityAlertService from './securityAlertService.js';
import riskAssessmentService from './riskAssessmentService.js';
import threatDetectionService from './threatDetectionService.js';
import logger from '../utils/logger.js';

class SecurityEventService {
  /**
   * Submit a security event
   */
  async submitEvent(eventData) {
    try {
      // Validate event data
      this.validateEventData(eventData);

      // Calculate initial risk score
      const riskScore = await riskAssessmentService.calculateEventRiskScore(eventData);
      eventData.risk_score = riskScore;

      // Create security event
      const event = await securityEventRepository.create(eventData);

      // Detect threats
      const threatResult = await threatDetectionService.detectThreats(event);
      
      if (threatResult.isThreat) {
        // Create security alert
        await securityAlertService.createAlert({
          event_id: event.id,
          alert_type: threatResult.threatType,
          alert_category: 'threat_detection',
          severity: threatResult.severity,
          title: threatResult.title,
          description: threatResult.description,
          alert_data: threatResult.data,
        });

        logger.warn(`Security threat detected: ${threatResult.threatType} for user ${eventData.user_id}`);
      }

      // Mark event as processed
      await securityEventRepository.markAsProcessed(event.id);

      return {
        success: true,
        event_id: event.id,
        threat_detected: threatResult.isThreat,
        risk_score: riskScore,
        message: 'Security event submitted successfully',
      };
    } catch (error) {
      logger.error('Error submitting security event:', error);
      throw error;
    }
  }

  /**
   * Get security events with filters
   */
  async getEvents(filters = {}, pagination = {}) {
    try {
      const events = await securityEventRepository.find(filters, pagination);
      
      return {
        success: true,
        events: events,
        total: events.length,
        page: pagination.page || 1,
        limit: pagination.limit || 50,
        message: 'Security events retrieved successfully',
      };
    } catch (error) {
      logger.error('Error getting security events:', error);
      throw error;
    }
  }

  /**
   * Get events by user ID
   */
  async getEventsByUserId(userId, limit = 50) {
    try {
      const events = await securityEventRepository.getEventsByUserId(userId, limit);
      
      return {
        success: true,
        events: events,
        total: events.length,
        message: 'User security events retrieved successfully',
      };
    } catch (error) {
      logger.error('Error getting user security events:', error);
      throw error;
    }
  }

  /**
   * Get high severity events
   */
  async getHighSeverityEvents(hours = 24) {
    try {
      const events = await securityEventRepository.getHighSeverityEvents(hours);
      
      return {
        success: true,
        events: events,
        total: events.length,
        message: 'High severity events retrieved successfully',
      };
    } catch (error) {
      logger.error('Error getting high severity events:', error);
      throw error;
    }
  }

  /**
   * Process unprocessed events
   */
  async processUnprocessedEvents() {
    try {
      const unprocessedEvents = await securityEventRepository.getUnprocessedEvents(100);
      let processedCount = 0;

      for (const event of unprocessedEvents) {
        try {
          // Detect threats for unprocessed events
          const threatResult = await threatDetectionService.detectThreats(event);
          
          if (threatResult.isThreat) {
            // Create security alert
            await securityAlertService.createAlert({
              event_id: event.id,
              alert_type: threatResult.threatType,
              alert_category: 'threat_detection',
              severity: threatResult.severity,
              title: threatResult.title,
              description: threatResult.description,
              alert_data: threatResult.data,
            });
          }

          // Mark as processed
          await securityEventRepository.markAsProcessed(event.id);
          processedCount++;

        } catch (error) {
          logger.error(`Error processing event ${event.id}:`, error);
        }
      }

      logger.info(`Processed ${processedCount} security events`);
      return {
        success: true,
        processed_count: processedCount,
        message: `Processed ${processedCount} security events`,
      };
    } catch (error) {
      logger.error('Error processing unprocessed events:', error);
      throw error;
    }
  }

  /**
   * Clean up old events
   */
  async cleanupOldEvents(days = 365) {
    try {
      const deletedCount = await securityEventRepository.deleteOldEvents(days);
      
      return {
        success: true,
        deleted_count: deletedCount,
        message: `Deleted ${deletedCount} old security events`,
      };
    } catch (error) {
      logger.error('Error cleaning up old events:', error);
      throw error;
    }
  }

  /**
   * Validate event data
   */
  validateEventData(eventData) {
    const requiredFields = ['service_name', 'event_type', 'event_category', 'severity'];
    
    for (const field of requiredFields) {
      if (!eventData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(eventData.severity)) {
      throw new Error(`Invalid severity: ${eventData.severity}`);
    }

    // Validate event category
    const validCategories = ['authentication', 'authorization', 'data_access', 'system'];
    if (!validCategories.includes(eventData.event_category)) {
      throw new Error(`Invalid event category: ${eventData.event_category}`);
    }
  }

  /**
   * Get event statistics
   */
  async getEventStatistics(days = 30) {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const stats = await securityEventRepository.find({
        start_date: cutoffDate,
      });

      const totalEvents = stats.length;
      const eventsBySeverity = {};
      const eventsByService = {};
      const eventsByCategory = {};

      stats.forEach(event => {
        // Count by severity
        eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
        
        // Count by service
        eventsByService[event.service_name] = (eventsByService[event.service_name] || 0) + 1;
        
        // Count by category
        eventsByCategory[event.event_category] = (eventsByCategory[event.event_category] || 0) + 1;
      });

      return {
        success: true,
        statistics: {
          total_events: totalEvents,
          events_by_severity: eventsBySeverity,
          events_by_service: eventsByService,
          events_by_category: eventsByCategory,
          period_days: days,
        },
        message: 'Event statistics retrieved successfully',
      };
    } catch (error) {
      logger.error('Error getting event statistics:', error);
      throw error;
    }
  }
}

export default new SecurityEventService(); 