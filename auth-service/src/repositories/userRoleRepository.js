import BaseRepository from './baseRepository.js';

/**
 * UserRole Repository với Master-Slave Pattern
 * Quản lý user-role relationships
 */
class UserRoleRepository extends BaseRepository {
  constructor() {
    super('user_roles');
  }

  // ========== USER-ROLE READ OPERATIONS ==========

  /**
   * Lấy roles của user (read từ slave)
   */
  async getUserRoles(userId) {
    return await this.getSlaveDb()
      .join('roles', 'user_roles.role_id', 'roles.public_id')
      .where('user_roles.user_id', userId)
      .select('roles.*');
  }

  /**
   * Lấy users của role (read từ slave)
   */
  async getRoleUsers(roleId) {
    return await this.getSlaveDb()
      .join('users', 'user_roles.user_id', 'users.public_id')
      .where('user_roles.role_id', roleId)
      .select('users.*');
  }

  /**
   * Kiểm tra user có role không (read từ slave)
   */
  async userHasRole(userId, roleId) {
    const result = await this.getSlaveDb().where({ user_id: userId, role_id: roleId }).first();
    return !!result;
  }

  /**
   * Lấy tất cả user-role relationships (read từ slave)
   */
  async getAllUserRoles() {
    return await this.getSlaveDb()
      .join('users', 'user_roles.user_id', 'users.public_id')
      .join('roles', 'user_roles.role_id', 'roles.public_id')
      .select(
        'user_roles.*',
        'users.email as user_email',
        'users.first_name as user_first_name',
        'users.last_name as user_last_name',
        'roles.name as role_name',
        'roles.description as role_description'
      );
  }

  // ========== USER-ROLE WRITE OPERATIONS ==========

  /**
   * Gán role cho user (write vào master)
   */
  async assignRoleToUser(userId, roleId) {
    return await this.create({
      user_id: userId,
      role_id: roleId,
      created_at: new Date(),
    });
  }

  /**
   * Xóa role khỏi user (write vào master)
   */
  async removeRoleFromUser(userId, roleId) {
    return await this.delete({ user_id: userId, role_id: roleId });
  }

  /**
   * Xóa tất cả roles của user (write vào master)
   */
  async removeAllUserRoles(userId) {
    return await this.delete({ user_id: userId });
  }

  /**
   * Bulk assign roles cho user (write vào master)
   */
  async assignMultipleRolesToUser(userId, roleIds) {
    const userRoles = roleIds.map((roleId) => ({
      user_id: userId,
      role_id: roleId,
      created_at: new Date(),
    }));

    return await this.getMasterDb()('user_roles').insert(userRoles);
  }
}

export default UserRoleRepository;
