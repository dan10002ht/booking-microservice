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
   * Tìm refresh token theo hash (read từ slave)
   */
  async findByHash(tokenHash) {
    return await this.findOne({ token_hash: tokenHash });
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
}

export default RefreshTokenRepository;
