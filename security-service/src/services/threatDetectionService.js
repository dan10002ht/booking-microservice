import logger from '../utils/logger.js';
import config from '../config/index.js';

class ThreatDetectionService {
  /**
   * Detect threats from security event
   */
  async detectThreats(event) {
    try {
      const threats = [];

      // Check for brute force attacks
      const bruteForceThreat = await this.detectBruteForceAttack(event);
      if (bruteForceThreat.isThreat) {
        threats.push(bruteForceThreat);
      }

      // Check for suspicious location
      const locationThreat = await this.detectSuspiciousLocation(event);
      if (locationThreat.isThreat) {
        threats.push(locationThreat);
      }

      // Check for unusual activity patterns
      const patternThreat = await this.detectUnusualPatterns(event);
      if (patternThreat.isThreat) {
        threats.push(patternThreat);
      }

      // Check for high-risk events
      const riskThreat = await this.detectHighRiskEvents(event);
      if (riskThreat.isThreat) {
        threats.push(riskThreat);
      }

      // Return the highest severity threat
      if (threats.length > 0) {
        const highestThreat = threats.reduce((prev, current) => 
          this.getSeverityWeight(current.severity) > this.getSeverityWeight(prev.severity) ? current : prev
        );

        return {
          isThreat: true,
          threatType: highestThreat.threatType,
          severity: highestThreat.severity,
          title: highestThreat.title,
          description: highestThreat.description,
          data: highestThreat.data,
          confidence: highestThreat.confidence,
        };
      }

      return {
        isThreat: false,
        threatType: null,
        severity: null,
        title: null,
        description: null,
        data: null,
        confidence: 0,
      };
    } catch (error) {
      logger.error('Error detecting threats:', error);
      return {
        isThreat: false,
        threatType: null,
        severity: null,
        title: null,
        description: null,
        data: null,
        confidence: 0,
      };
    }
  }

  /**
   * Detect brute force attacks
   */
  async detectBruteForceAttack(event) {
    try {
      // This would typically query recent failed login attempts
      // For now, we'll use a simple heuristic based on event type and frequency
      
      if (event.event_type === 'login_failed' && event.severity === 'high') {
        return {
          isThreat: true,
          threatType: 'brute_force_attack',
          severity: 'high',
          title: 'Potential Brute Force Attack Detected',
          description: `Multiple failed login attempts detected for user ${event.user_id}`,
          data: {
            user_id: event.user_id,
            ip_address: event.ip_address,
            event_count: 1, // Would be calculated from recent events
          },
          confidence: 0.8,
        };
      }

      return { isThreat: false };
    } catch (error) {
      logger.error('Error detecting brute force attack:', error);
      return { isThreat: false };
    }
  }

  /**
   * Detect suspicious location
   */
  async detectSuspiciousLocation(event) {
    try {
      // This would typically check against known user locations
      // For now, we'll use a simple heuristic
      
      if (event.location_data && event.event_type === 'login_success') {
        const locationData = typeof event.location_data === 'string' 
          ? JSON.parse(event.location_data) 
          : event.location_data;

        // Check if location is significantly different from user's usual locations
        // This is a simplified check - in production, you'd have user location history
        if (locationData.country && locationData.country !== 'VN') {
          return {
            isThreat: true,
            threatType: 'suspicious_location',
            severity: 'medium',
            title: 'Login from Unusual Location',
            description: `Login detected from unusual location: ${locationData.country}`,
            data: {
              user_id: event.user_id,
              location: locationData,
              ip_address: event.ip_address,
            },
            confidence: 0.7,
          };
        }
      }

      return { isThreat: false };
    } catch (error) {
      logger.error('Error detecting suspicious location:', error);
      return { isThreat: false };
    }
  }

  /**
   * Detect unusual activity patterns
   */
  async detectUnusualPatterns(event) {
    try {
      // Check for unusual time patterns
      const hour = new Date(event.created_at).getHours();
      
      // Unusual login time (2 AM - 6 AM)
      if (event.event_type === 'login_success' && hour >= 2 && hour <= 6) {
        return {
          isThreat: true,
          threatType: 'unusual_activity_time',
          severity: 'medium',
          title: 'Unusual Login Time',
          description: `Login detected during unusual hours (${hour}:00)`,
          data: {
            user_id: event.user_id,
            hour: hour,
            ip_address: event.ip_address,
          },
          confidence: 0.6,
        };
      }

      // Check for rapid successive events
      if (event.event_type === 'login_success' && event.severity === 'high') {
        return {
          isThreat: true,
          threatType: 'rapid_activity',
          severity: 'medium',
          title: 'Rapid Activity Detected',
          description: 'Multiple rapid login attempts detected',
          data: {
            user_id: event.user_id,
            ip_address: event.ip_address,
          },
          confidence: 0.7,
        };
      }

      return { isThreat: false };
    } catch (error) {
      logger.error('Error detecting unusual patterns:', error);
      return { isThreat: false };
    }
  }

  /**
   * Detect high-risk events
   */
  async detectHighRiskEvents(event) {
    try {
      // Critical severity events are always considered threats
      if (event.severity === 'critical') {
        return {
          isThreat: true,
          threatType: 'critical_event',
          severity: 'critical',
          title: 'Critical Security Event',
          description: `Critical security event detected: ${event.event_type}`,
          data: {
            user_id: event.user_id,
            event_type: event.event_type,
            event_category: event.event_category,
            ip_address: event.ip_address,
          },
          confidence: 1.0,
        };
      }

      // High risk score events
      if (event.risk_score >= 80) {
        return {
          isThreat: true,
          threatType: 'high_risk_event',
          severity: 'high',
          title: 'High Risk Event Detected',
          description: `High risk event detected (score: ${event.risk_score})`,
          data: {
            user_id: event.user_id,
            risk_score: event.risk_score,
            event_type: event.event_type,
            ip_address: event.ip_address,
          },
          confidence: 0.9,
        };
      }

      return { isThreat: false };
    } catch (error) {
      logger.error('Error detecting high-risk events:', error);
      return { isThreat: false };
    }
  }

  /**
   * Get severity weight for comparison
   */
  getSeverityWeight(severity) {
    const weights = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4,
    };
    return weights[severity] || 0;
  }

  /**
   * Get threat patterns
   */
  async getThreatPatterns(patternType = null, startDate = null, endDate = null, limit = 100) {
    try {
      // This would typically query the database for threat patterns
      // For now, return mock data
      const patterns = [
        {
          pattern_id: '1',
          pattern_type: 'brute_force',
          pattern_name: 'Brute Force Login Attempts',
          description: 'Multiple failed login attempts from same IP',
          confidence_score: 0.85,
          occurrence_count: 15,
          first_seen: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          last_seen: new Date().toISOString(),
          indicators: ['multiple_failed_logins', 'same_ip_address'],
          pattern_data: Buffer.from(JSON.stringify({ threshold: 5, time_window: 300 })),
        },
        {
          pattern_id: '2',
          pattern_type: 'location_anomaly',
          pattern_name: 'Unusual Location Login',
          description: 'Login from location not in user history',
          confidence_score: 0.75,
          occurrence_count: 8,
          first_seen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          last_seen: new Date().toISOString(),
          indicators: ['new_country', 'new_city', 'vpn_detected'],
          pattern_data: Buffer.from(JSON.stringify({ distance_threshold: 1000 })),
        },
      ];

      return {
        success: true,
        patterns: patterns,
        message: 'Threat patterns retrieved successfully',
      };
    } catch (error) {
      logger.error('Error getting threat patterns:', error);
      throw error;
    }
  }

  /**
   * Get analytics
   */
  async getAnalytics(userId = null, startDate = null, endDate = null, metricType = 'overview') {
    try {
      // This would typically calculate analytics from the database
      // For now, return mock data
      const analytics = {
        user_id: userId,
        total_events: 150,
        high_severity_events: 12,
        total_alerts: 8,
        open_alerts: 3,
        total_incidents: 2,
        open_incidents: 1,
        average_risk_score: 45.5,
        top_threats: ['brute_force_attack', 'suspicious_location', 'unusual_activity_time'],
        events_by_service: {
          'auth-service': 80,
          'device-service': 45,
          'booking-service': 25,
        },
        events_by_severity: {
          'low': 100,
          'medium': 35,
          'high': 12,
          'critical': 3,
        },
        events_by_hour: {
          '0': 5,
          '1': 3,
          '2': 2,
          // ... more hours
        },
        events_by_day: {
          'monday': 25,
          'tuesday': 30,
          'wednesday': 28,
          // ... more days
        },
      };

      return {
        success: true,
        analytics: analytics,
        message: 'Analytics retrieved successfully',
      };
    } catch (error) {
      logger.error('Error getting analytics:', error);
      throw error;
    }
  }
}

export default new ThreatDetectionService(); 