import BaseRepository from './baseRepository.js';

/**
 * EmailVerificationToken Repository với Master-Slave Pattern
 * Quản lý email verification tokens
 */
class EmailVerificationTokenRepository extends BaseRepository {
  constructor() {
    super('email_verification_tokens');
  }

  // ========== EMAIL VERIFICATION TOKEN OPERATIONS ==========

  /**
   * Tạo email verification token (write vào master)
   */
  async createEmailVerificationToken(tokenData) {
    const normalizedData = {
      ...tokenData,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const [token] = await this.create(normalizedData);
    return token;
  }

  /**
   * Tìm valid email verification tokens (read từ slave)
   */
  async findValid() {
    return await this.getSlaveDb().where('is_used', false).where('expires_at', '>', new Date());
  }

  /**
   * Tìm email verification token theo token (read từ slave)
   */
  async findByToken(token) {
    return await this.findOne({ token });
  }

  /**
   * Mark email verification token as used (write vào master)
   */
  async markAsUsed(id) {
    return await this.updateById(id, {
      is_used: true,
      updated_at: new Date(),
    });
  }

  /**
   * Xóa expired email verification tokens (write vào master)
   */
  async deleteExpired() {
    return await this.getMasterDb().where('expires_at', '<', new Date()).del();
  }

  /**
   * Tìm email verification token theo ID (read từ slave)
   */
  async findById(id) {
    return await this.findOne({ id });
  }
}

export default EmailVerificationTokenRepository;
