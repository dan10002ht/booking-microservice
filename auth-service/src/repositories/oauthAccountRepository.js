import BaseRepository from './baseRepository.js';

/**
 * OAuth Account Repository với Master-Slave Pattern
 * Kế thừa từ BaseRepository để tự động route read/write operations
 */
class OAuthAccountRepository extends BaseRepository {
  constructor() {
    super('oauth_accounts');
  }

  // ========== OAUTH-SPECIFIC READ OPERATIONS ==========

  /**
   * Tìm OAuth account theo provider và provider_user_id (read từ slave)
   */
  async findByProvider(provider, providerUserId) {
    return await this.findOne({
      provider,
      provider_user_id: providerUserId,
    });
  }

  /**
   * Tìm OAuth accounts theo user_id (read từ slave)
   */
  async findByUserId(userId) {
    return await this.findMany({ user_id: userId });
  }

  /**
   * Tìm OAuth account theo user_id và provider (read từ slave)
   */
  async findByUserIdAndProvider(userId, provider) {
    return await this.findOne({
      user_id: userId,
      provider,
    });
  }

  /**
   * Tìm OAuth account với user info (read từ slave)
   */
  async findWithUser(id) {
    return await this.getSlaveDb()
      .join('users', 'oauth_accounts.user_id', 'users.id')
      .where('oauth_accounts.id', id)
      .select('oauth_accounts.*', 'users.email', 'users.username', 'users.status')
      .first();
  }

  // ========== OAUTH-SPECIFIC WRITE OPERATIONS ==========

  /**
   * Tạo OAuth account mới (write vào master)
   */
  async createOAuthAccount(oauthData) {
    const normalizedData = {
      ...oauthData,
      created_at: new Date(),
      updated_at: new Date(),
    };

    return await this.create(normalizedData);
  }

  /**
   * Cập nhật OAuth account (write vào master)
   */
  async updateOAuthAccount(id, updateData) {
    const normalizedData = {
      ...updateData,
      updated_at: new Date(),
    };

    return await this.updateById(id, normalizedData);
  }

  /**
   * Xóa OAuth account (write vào master)
   */
  async deleteOAuthAccount(id) {
    return await this.deleteById(id);
  }

  /**
   * Xóa tất cả OAuth accounts của user (write vào master)
   */
  async deleteByUserId(userId) {
    return await this.delete({ user_id: userId });
  }

  /**
   * Link OAuth account với user (write vào master)
   */
  async linkOAuthAccount(userId, oauthData) {
    const normalizedData = {
      ...oauthData,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    return await this.create(normalizedData);
  }

  /**
   * Unlink OAuth account (write vào master)
   */
  async unlinkOAuthAccount(userId, provider) {
    return await this.delete({
      user_id: userId,
      provider,
    });
  }
}

export default OAuthAccountRepository;
