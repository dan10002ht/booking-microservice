import BaseRepository from './baseRepository.js';

/**
 * Role Repository với Master-Slave Pattern
 * Kế thừa từ BaseRepository để tự động route read/write operations
 */
class RoleRepository extends BaseRepository {
  constructor() {
    super('roles');
  }

  // ========== ROLE-SPECIFIC READ OPERATIONS ==========

  /**
   * Tìm role theo name (read từ slave)
   */
  async findByName(name) {
    return await this.findOne({ name });
  }

  /**
   * Tìm role với permissions (read từ slave)
   */
  async findWithPermissions(publicId) {
    // Lấy role trước
    const role = await this.findOne({ public_id: publicId });

    if (!role) {
      return null;
    }

    // Lấy permissions của role
    const permissions = await this.getSlaveDb()
      .select(
        'permissions.public_id as id',
        'permissions.name',
        'permissions.resource',
        'permissions.action'
      )
      .from('permissions')
      .join('role_permissions', 'permissions.public_id', 'role_permissions.permission_id')
      .where('role_permissions.role_id', publicId);

    // Trả về role với permissions
    return {
      ...role,
      permissions: permissions || [],
    };
  }

  /**
   * Lấy tất cả roles (read từ slave)
   */
  async getAllRoles() {
    return await this.findAll({ orderBy: 'name' });
  }

  /**
   * Lấy user roles (read từ slave)
   */
  async getUserRoles(userId) {
    return await this.getSlaveDb()
      .join('user_roles', 'roles.public_id', 'user_roles.role_id')
      .where('user_roles.user_id', userId)
      .select('roles.*');
  }

  /**
   * Tìm roles theo user ID (read từ slave)
   */
  async findByUserId(userId) {
    return await this.getSlaveDb()
      .join('user_roles', 'roles.public_id', 'user_roles.role_id')
      .where('user_roles.user_id', userId)
      .select('roles.*');
  }

  // ========== ROLE-SPECIFIC WRITE OPERATIONS ==========

  /**
   * Tạo role mới (write vào master)
   */
  async createRole(roleData) {
    const normalizedData = {
      ...roleData,
      created_at: new Date(),
      updated_at: new Date(),
    };

    return await this.create(normalizedData);
  }

  /**
   * Cập nhật role (write vào master)
   */
  async updateRole(id, updateData) {
    const normalizedData = {
      ...updateData,
      updated_at: new Date(),
    };

    return await this.updateById(id, normalizedData);
  }

  /**
   * Xóa role (write vào master)
   */
  async deleteRole(id) {
    return await this.deleteById(id);
  }
}

export default RoleRepository;
