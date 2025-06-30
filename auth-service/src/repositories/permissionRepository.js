import BaseRepository from './baseRepository.js';

/**
 * Permission Repository với Master-Slave Pattern
 * Kế thừa từ BaseRepository để tự động route read/write operations
 */
class PermissionRepository extends BaseRepository {
  constructor() {
    super('permissions');
  }

  // ========== PERMISSION-SPECIFIC READ OPERATIONS ==========

  /**
   * Tìm permission theo name (read từ slave)
   */
  async findByName(name) {
    return await this.findOne({ name });
  }

  /**
   * Tìm permission theo resource và action (read từ slave)
   */
  async findByResourceAndAction(resource, action) {
    return await this.findOne({ resource, action });
  }

  /**
   * Tìm permissions theo resource (read từ slave)
   */
  async findByResource(resource) {
    return await this.findMany({ resource }, { orderBy: 'action' });
  }

  /**
   * Lấy tất cả permissions (read từ slave)
   */
  async getAllPermissions() {
    return await this.findAll({ orderBy: ['resource', 'action'] });
  }

  /**
   * Lấy role permissions (read từ slave)
   */
  async getRolePermissions(roleId) {
    return await this.getSlaveDb()
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .where('role_permissions.role_id', roleId)
      .select('permissions.*');
  }

  /**
   * Lấy user permissions (read từ slave)
   */
  async getUserPermissions(userId) {
    return await this.getSlaveDb()
      .join('user_roles', 'user_roles.role_id', 'role_permissions.role_id')
      .join('role_permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('user_roles.user_id', userId)
      .select('permissions.*')
      .distinct();
  }

  // ========== PERMISSION-SPECIFIC WRITE OPERATIONS ==========

  /**
   * Tạo permission mới (write vào master)
   */
  async createPermission(permissionData) {
    const normalizedData = {
      ...permissionData,
      created_at: new Date(),
      updated_at: new Date(),
    };

    return await this.create(normalizedData);
  }

  /**
   * Cập nhật permission (write vào master)
   */
  async updatePermission(id, updateData) {
    const normalizedData = {
      ...updateData,
      updated_at: new Date(),
    };

    return await this.updateById(id, normalizedData);
  }

  /**
   * Xóa permission (write vào master)
   */
  async deletePermission(id) {
    return await this.deleteById(id);
  }

  /**
   * Gán permission cho role (write vào master)
   */
  async assignToRole(roleId, permissionId) {
    return await this.getMasterDb()('role_permissions').insert({
      role_id: roleId,
      permission_id: permissionId,
      created_at: new Date(),
    });
  }

  /**
   * Xóa permission khỏi role (write vào master)
   */
  async removeFromRole(roleId, permissionId) {
    return await this.getMasterDb()('role_permissions')
      .where({ role_id: roleId, permission_id: permissionId })
      .del();
  }
}

export default PermissionRepository;
