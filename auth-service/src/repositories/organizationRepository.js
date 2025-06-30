import BaseRepository from './baseRepository.js';

/**
 * Organization Repository với Master-Slave Pattern
 * Kế thừa từ BaseRepository để tự động route read/write operations
 */
class OrganizationRepository extends BaseRepository {
  constructor() {
    super('organizations');
  }

  // ========== ORGANIZATION-SPECIFIC READ OPERATIONS ==========

  /**
   * Tìm organization theo user_id (read từ slave)
   */
  async findByUserId(userId) {
    return await this.findOne({ user_id: userId });
  }

  /**
   * Tìm organization với user info (read từ slave)
   */
  async findWithUser(id) {
    return await this.getSlaveDb()
      .join('users', 'organizations.user_id', 'users.id')
      .where('organizations.id', id)
      .select(
        'organizations.*',
        'users.email',
        'users.username',
        'users.first_name',
        'users.last_name'
      )
      .first();
  }

  /**
   * Search organizations (read từ slave)
   */
  async searchOrganizations(searchTerm, options = {}) {
    const { limit = 20, offset = 0, orderBy = 'created_at', orderDirection = 'desc' } = options;

    return await this.getSlaveDb()
      .select('*')
      .where(function () {
        this.where('name', 'ilike', `%${searchTerm}%`).orWhere(
          'description',
          'ilike',
          `%${searchTerm}%`
        );
      })
      .orderBy(orderBy, orderDirection)
      .limit(limit)
      .offset(offset);
  }

  /**
   * Lấy organizations theo verification status (read từ slave)
   */
  async findByVerificationStatus(isVerified, options = {}) {
    return await this.findMany({ is_verified: isVerified }, options);
  }

  /**
   * Lấy organizations với pagination (read từ slave)
   */
  async getOrganizationsWithPagination(filters = {}, pagination = {}) {
    const { page = 1, pageSize = 20 } = pagination;
    const offset = (page - 1) * pageSize;

    let conditions = {};
    if (filters.is_verified !== undefined) {
      conditions.is_verified = filters.is_verified;
    }

    const options = {
      limit: pageSize,
      offset,
      orderBy: pagination.sortBy || 'created_at',
      orderDirection: pagination.sortOrder || 'desc',
    };

    const [organizations, total] = await Promise.all([
      this.findMany(conditions, options),
      this.count(conditions),
    ]);

    return {
      data: organizations,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page < Math.ceil(total / pageSize),
        hasPrev: page > 1,
      },
    };
  }

  // ========== ORGANIZATION-SPECIFIC WRITE OPERATIONS ==========

  /**
   * Tạo organization mới (write vào master)
   */
  async createOrganization(organizationData) {
    const normalizedData = {
      ...organizationData,
      created_at: new Date(),
      updated_at: new Date(),
    };

    return await this.create(normalizedData);
  }

  /**
   * Cập nhật organization (write vào master)
   */
  async updateOrganization(id, updateData) {
    const normalizedData = {
      ...updateData,
      updated_at: new Date(),
    };

    return await this.updateById(id, normalizedData);
  }

  /**
   * Xóa organization (write vào master)
   */
  async deleteOrganization(id) {
    return await this.deleteById(id);
  }

  /**
   * Verify organization (write vào master)
   */
  async verifyOrganization(id) {
    return await this.updateById(id, {
      is_verified: true,
      verified_at: new Date(),
      updated_at: new Date(),
    });
  }

  /**
   * Unverify organization (write vào master)
   */
  async unverifyOrganization(id) {
    return await this.updateById(id, {
      is_verified: false,
      verified_at: null,
      updated_at: new Date(),
    });
  }

  /**
   * Bulk update organizations (write vào master)
   */
  async bulkUpdateOrganizations(organizationIds, updateData) {
    const normalizedData = {
      ...updateData,
      updated_at: new Date(),
    };

    return await this.update({ id: { $in: organizationIds } }, normalizedData);
  }
}

export default OrganizationRepository;
