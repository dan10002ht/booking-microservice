import BaseRepository from './baseRepository.js';
import bcrypt from 'bcrypt';

/**
 * User Repository với Master-Slave Pattern
 * Chỉ quản lý users table
 * Extends BaseRepository và follows IUserRepository interface
 */
class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  // ========== USER-SPECIFIC READ OPERATIONS ==========

  /**
   * Tìm user theo email (read từ slave)
   */
  async findByEmail(email) {
    return await this.findOne({ email: email.toLowerCase() });
  }

  /**
   * Tìm user theo phone (read từ slave)
   */
  async findByPhone(phone) {
    return await this.findOne({ phone });
  }

  /**
   * Tìm users đang active (read từ slave)
   */
  async findActiveUsers(options = {}) {
    return await this.findMany({ is_active: true }, options);
  }

  /**
   * Tìm users theo status (read từ slave)
   */
  async findByStatus(isActive, options = {}) {
    return await this.findMany({ is_active: isActive }, options);
  }

  /**
   * Search users theo nhiều tiêu chí (read từ slave)
   */
  async searchUsers(searchTerm, options = {}) {
    const { limit = 20, offset = 0, orderBy = 'created_at', orderDirection = 'desc' } = options;

    return await this.getSlaveDb()
      .select('*')
      .where(function () {
        this.where('email', 'ilike', `%${searchTerm}%`)
          .orWhere('first_name', 'ilike', `%${searchTerm}%`)
          .orWhere('last_name', 'ilike', `%${searchTerm}%`)
          .orWhere('phone', 'ilike', `%${searchTerm}%`);
      })
      .orderBy(orderBy, orderDirection)
      .limit(limit)
      .offset(offset);
  }

  /**
   * Lấy user với roles (read từ slave)
   */
  async findWithRoles(publicId) {
    // Lấy user trước
    const user = await this.findByPublicId(publicId);

    if (!user) {
      return null;
    }

    // Lấy roles của user bằng internal id
    const roles = await this.getSlaveDb()
      .select('roles.public_id as id', 'roles.name', 'roles.description')
      .from('roles')
      .join('user_roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', user.id);

    // Trả về user với roles
    return {
      ...user,
      roles: roles || [],
    };
  }

  /**
   * Lấy user với organization (read từ slave)
   */
  async findWithOrganization(publicId) {
    const user = await this.findByPublicId(publicId);
    if (!user) return null;

    return await this.getSlaveDb()
      .leftJoin('organizations', 'users.id', 'organizations.user_id')
      .where('users.id', user.id)
      .select('users.*', 'organizations.*')
      .first();
  }

  // ========== USER-SPECIFIC WRITE OPERATIONS ==========

  /**
   * Tạo user mới với password được hash (write vào master)
   */
  async createUser(userData) {
    const { password, ...otherData } = userData;

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Chuẩn hóa email
    const normalizedData = {
      ...otherData,
      email: otherData.email?.toLowerCase(),
      password_hash: hashedPassword,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await this.create(normalizedData);
    return result;
  }

  /**
   * Cập nhật user (write vào master)
   */
  async updateUser(userId, updateData) {
    const normalizedData = {
      ...updateData,
      email: updateData.email?.toLowerCase(),
      username: updateData.username?.toLowerCase(),
      updated_at: new Date(),
    };

    return await this.updateById(userId, normalizedData);
  }

  /**
   * Cập nhật password (write vào master)
   */
  async updatePassword(userId, newPassword) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    return await this.updateById(userId, {
      password_hash: hashedPassword,
      updated_at: new Date(),
    });
  }

  /**
   * Cập nhật user status (write vào master)
   */
  async updateUserStatus(userId, isActive) {
    return await this.updateById(userId, {
      is_active: isActive,
      updated_at: new Date(),
    });
  }

  /**
   * Cập nhật last login (write vào master)
   */
  async updateLastLogin(userId) {
    return await this.updateByPublicId(userId, {
      last_login_at: new Date(),
      updated_at: new Date(),
    });
  }

  /**
   * Soft delete user (write vào master)
   */
  async softDeleteUser(userId) {
    return await this.updateById(userId, {
      is_active: false,
      deleted_at: new Date(),
      updated_at: new Date(),
    });
  }

  /**
   * Hard delete user (write vào master)
   */
  async hardDeleteUser(userId) {
    return await this.deleteById(userId);
  }

  // ========== AUTHENTICATION OPERATIONS ==========

  /**
   * Verify password
   */
  async verifyPassword(userId, password) {
    const user = await this.findById(userId);
    if (!user) {
      return false;
    }

    return await bcrypt.compare(password, user.password_hash);
  }

  /**
   * Verify email và password cho login
   */
  async verifyCredentials(email, password) {
    const user = await this.findByEmail(email);
    if (!user || !user.is_active) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  // ========== BULK OPERATIONS ==========

  /**
   * Bulk update users (write vào master)
   */
  async bulkUpdateUsers(userIds, updateData) {
    return await this.getMasterDb()
      .whereIn('id', userIds)
      .update({
        ...updateData,
        updated_at: new Date(),
      })
      .returning('*');
  }

  /**
   * Bulk delete users (write vào master)
   */
  async bulkDeleteUsers(userIds) {
    return await this.getMasterDb().whereIn('id', userIds).del().returning('*');
  }
}

export default UserRepository;
