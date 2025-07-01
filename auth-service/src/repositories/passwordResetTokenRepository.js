import BaseRepository from './baseRepository.js';

/**
 * PasswordResetToken Repository với Master-Slave Pattern
 * Quản lý password reset tokens
 */
class PasswordResetTokenRepository extends BaseRepository {
  constructor() {
    super('password_reset_tokens');
  }

  // ========== PASSWORD RESET TOKEN OPERATIONS ==========

  /**
   * Tạo password reset token (write vào master)
   */
  async createPasswordResetToken(tokenData) {
    const normalizedData = {
      ...tokenData,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const [token] = await this.create(normalizedData);
    return token;
  }

  /**
   * Tìm valid password reset tokens (read từ slave)
   */
  async findValid() {
    return await this.getSlaveDb().where('is_used', false).where('expires_at', '>', new Date());
  }

  /**
   * Tìm password reset token theo token hash (read từ slave)
   */
  async findByToken(tokenHash) {
    return await this.findOne({ token_hash: tokenHash });
  }

  /**
   * Mark password reset token as used (write vào master)
   */
  async markAsUsed(id) {
    return await this.updateById(id, {
      is_used: true,
      updated_at: new Date(),
    });
  }

  /**
   * Xóa expired password reset tokens (write vào master)
   */
  async deleteExpired() {
    return await this.getMasterDb().where('expires_at', '<', new Date()).del();
  }

  /**
   * Tìm password reset token theo ID (read từ slave)
   */
  async findById(id) {
    return await this.findOne({ id });
  }

  /**
   * Đếm số lượng password reset tokens (read từ slave)
   */
  async count() {
    const result = await this.getSlaveDb().count('* as count').first();
    return parseInt(result.count);
  }
}

export default PasswordResetTokenRepository;
