import BaseRepository from './baseRepository.js';

/**
 * UserSession Repository với Master-Slave Pattern
 * Quản lý user sessions
 */
class UserSessionRepository extends BaseRepository {
  constructor() {
    super('user_sessions');
  }

  // ========== USER SESSION OPERATIONS ==========

  /**
   * Tạo user session (write vào master)
   */
  async createUserSession(userId, sessionData) {
    const normalizedData = {
      ...sessionData,
      user_id: userId,
      created_at: new Date(),
    };

    const session = await this.create(normalizedData);
    return session;
  }

  /**
   * Lấy user sessions (read từ slave)
   */
  async findByUserId(userId) {
    return await this.getSlaveDb()
      .where('user_id', userId)
      .where('expires_at', '>', new Date())
      .orderBy('created_at', 'desc');
  }

  /**
   * Tìm session theo session_id (read từ slave)
   */
  async findBySessionId(sessionId) {
    return await this.findOne({ session_id: sessionId });
  }

  /**
   * Xóa user session (write vào master)
   */
  async deleteBySessionId(sessionId) {
    return await this.getMasterDb().where('session_id', sessionId).del();
  }

  /**
   * Xóa tất cả sessions của user (write vào master)
   */
  async deleteAllByUserId(userId) {
    return await this.getMasterDb().where('user_id', userId).del();
  }

  /**
   * Xóa expired sessions (write vào master)
   */
  async deleteExpired() {
    return await this.getMasterDb().where('expires_at', '<', new Date()).del();
  }

  /**
   * Tìm session theo ID (read từ slave)
   */
  async findById(id) {
    return await this.findOne({ id });
  }
}

export default UserSessionRepository;
