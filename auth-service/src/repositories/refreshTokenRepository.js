import BaseRepository from './baseRepository.js';

/**
 * RefreshToken Repository với Master-Slave Pattern
 * Quản lý refresh tokens
 */
class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super('refresh_tokens');
  }

  // ========== REFRESH TOKEN OPERATIONS ==========

  /**
   * Tạo refresh token (write vào master)
   * Revoke token cũ của user trước khi tạo mới để tránh trùng lặp
   */
  async createRefreshToken(tokenData) {
    const normalizedData = {
      ...tokenData,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Revoke existing tokens for this user to avoid conflicts
    await this.revokeAllByUserId(tokenData.user_id);

    const token = await this.create(normalizedData);
    return token;
  }

  /**
   * Tạo refresh token cho session cụ thể (write vào master)
   * Không revoke tokens khác - cho phép multiple sessions
   */
  async createRefreshTokenForSession(tokenData) {
    const normalizedData = {
      ...tokenData,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const token = await this.create(normalizedData);
    return token;
  }

  /**
   * Tìm valid refresh tokens (read từ slave)
   */
  async findValid() {
    return await this.getSlaveDb().where('is_revoked', false).where('expires_at', '>', new Date());
  }

  /**
   * Tìm refresh token theo token hash (read từ slave)
   */
  async findByToken(tokenHash) {
    return await this.findOne({ token_hash: tokenHash });
  }

  /**
   * Tìm refresh token theo hash (read từ slave)
   */
  async findByHash(tokenHash) {
    return await this.findOne({ token_hash: tokenHash });
  }

  /**
   * Tìm refresh token theo session ID (read từ slave)
   */
  async findBySessionId(sessionId) {
    return await this.findOne({ session_id: sessionId });
  }

  /**
   * Alias cho findByHash để tương thích với service
   */
  async findRefreshTokenByHash(tokenHash) {
    return this.findByHash(tokenHash);
  }

  /**
   * Tìm valid refresh tokens của user (read từ slave)
   */
  async findValidByUserId(userId) {
    return await this.getSlaveDb()
      .where({ user_id: userId, is_revoked: false })
      .where('expires_at', '>', new Date());
  }

  /**
   * Tìm valid refresh tokens theo session ID (read từ slave)
   */
  async findValidBySessionId(sessionId) {
    return await this.getSlaveDb()
      .where({ session_id: sessionId, is_revoked: false })
      .where('expires_at', '>', new Date());
  }

  /**
   * Revoke refresh token (write vào master)
   */
  async revokeById(id) {
    return await this.updateById(id, {
      is_revoked: true,
      updated_at: new Date(),
    });
  }

  /**
   * Alias cho revokeById để tương thích với service
   */
  async revokeRefreshToken(id) {
    return this.revokeById(id);
  }

  /**
   * Alias cho revokeById để tương thích với TokenRepository
   */
  async revokeToken(id) {
    return this.revokeById(id);
  }

  /**
   * Revoke refresh token theo session ID (write vào master)
   * Sử dụng cho selective logout
   */
  async revokeBySessionId(sessionId) {
    return await this.getMasterDb()
      .where({ session_id: sessionId })
      .update({ is_revoked: true, updated_at: new Date() });
  }

  /**
   * Revoke tất cả tokens của user (write vào master)
   */
  async revokeAllByUserId(userId) {
    return await this.getMasterDb()
      .where({ user_id: userId })
      .update({ is_revoked: true, updated_at: new Date() });
  }

  /**
   * Alias cho revokeAllByUserId để tương thích với service
   */
  async revokeAllUserTokens(userId) {
    return this.revokeAllByUserId(userId);
  }

  /**
   * Xóa expired tokens (write vào master)
   */
  async deleteExpired() {
    return await this.getMasterDb().where('expires_at', '<', new Date()).del();
  }

  /**
   * Tìm refresh token theo ID (read từ slave)
   */
  async findById(id) {
    return await this.findOne({ id });
  }

  /**
   * Đếm số lượng refresh tokens (read từ slave)
   */
  async count() {
    const result = await this.getSlaveDb().count('* as count').first();
    return parseInt(result.count);
  }

  /**
   * Lấy thống kê refresh tokens của user (read từ slave)
   */
  async getUserTokenStats(userId) {
    const [total, active, revoked] = await Promise.all([
      this.getSlaveDb().where('user_id', userId).count('* as count').first(),
      this.getSlaveDb()
        .where({ user_id: userId, is_revoked: false })
        .where('expires_at', '>', new Date())
        .count('* as count')
        .first(),
      this.getSlaveDb().where({ user_id: userId, is_revoked: true }).count('* as count').first(),
    ]);

    return {
      total: parseInt(total.count),
      active: parseInt(active.count),
      revoked: parseInt(revoked.count),
    };
  }
}

export default RefreshTokenRepository;
