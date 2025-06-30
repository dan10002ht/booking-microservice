import IRepository from './IRepository.js';

/**
 * User Repository Interface
 * Định nghĩa contract cho UserRepository
 */
export default class IUserRepository extends IRepository {
  // ========== USER-SPECIFIC READ OPERATIONS ==========

  /**
   * Tìm user theo email
   * @param {string} email - User email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  /**
   * Tìm user theo phone
   * @param {string} phone - User phone
   * @returns {Promise<Object|null>}
   */
  async findByPhone(phone) {
    throw new Error('Method not implemented');
  }

  /**
   * Tìm users đang active
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findActiveUsers(options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Tìm users theo status
   * @param {boolean} isActive - Active status
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByStatus(isActive, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Search users theo nhiều tiêu chí
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async searchUsers(searchTerm, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Lấy user với roles
   * @param {string} publicId - User public ID
   * @returns {Promise<Object|null>}
   */
  async findWithRoles(publicId) {
    throw new Error('Method not implemented');
  }

  /**
   * Lấy user với organization
   * @param {string} publicId - User public ID
   * @returns {Promise<Object|null>}
   */
  async findWithOrganization(publicId) {
    throw new Error('Method not implemented');
  }

  // ========== USER-SPECIFIC WRITE OPERATIONS ==========

  /**
   * Tạo user mới với password được hash
   * @param {Object} userData - User data
   * @returns {Promise<Object>}
   */
  async createUser(userData) {
    throw new Error('Method not implemented');
  }

  /**
   * Cập nhật user
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>}
   */
  async updateUser(userId, updateData) {
    throw new Error('Method not implemented');
  }

  /**
   * Cập nhật password
   * @param {string} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<Object>}
   */
  async updatePassword(userId, newPassword) {
    throw new Error('Method not implemented');
  }

  /**
   * Cập nhật user status
   * @param {string} userId - User ID
   * @param {boolean} isActive - Active status
   * @returns {Promise<Object>}
   */
  async updateUserStatus(userId, isActive) {
    throw new Error('Method not implemented');
  }

  /**
   * Cập nhật last login
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async updateLastLogin(userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Soft delete user
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async softDeleteUser(userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Hard delete user
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async hardDeleteUser(userId) {
    throw new Error('Method not implemented');
  }

  // ========== AUTHENTICATION OPERATIONS ==========

  /**
   * Verify password
   * @param {string} userId - User ID
   * @param {string} password - Password to verify
   * @returns {Promise<boolean>}
   */
  async verifyPassword(userId, password) {
    throw new Error('Method not implemented');
  }

  /**
   * Verify credentials (email + password)
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object|null>}
   */
  async verifyCredentials(email, password) {
    throw new Error('Method not implemented');
  }

  // ========== BULK OPERATIONS ==========

  /**
   * Bulk update users
   * @param {Array<string>} userIds - Array of user IDs
   * @param {Object} updateData - Update data
   * @returns {Promise<Array>}
   */
  async bulkUpdateUsers(userIds, updateData) {
    throw new Error('Method not implemented');
  }

  /**
   * Bulk delete users
   * @param {Array<string>} userIds - Array of user IDs
   * @returns {Promise<Array>}
   */
  async bulkDeleteUsers(userIds) {
    throw new Error('Method not implemented');
  }
}
