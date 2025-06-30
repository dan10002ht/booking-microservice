import BaseRepository from './baseRepository.js';

/**
 * UserProfile Repository với Master-Slave Pattern
 * Quản lý user profiles
 */
class UserProfileRepository extends BaseRepository {
  constructor() {
    super('user_profiles');
  }

  // ========== USER PROFILE OPERATIONS ==========

  /**
   * Tạo user profile (write vào master)
   */
  async createUserProfile(userId, profileData) {
    const normalizedData = {
      ...profileData,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const [profile] = await this.create(normalizedData);
    return profile;
  }

  /**
   * Tìm profile theo user_id (read từ slave)
   */
  async findByUserId(userId) {
    return await this.findOne({ user_id: userId });
  }

  /**
   * Cập nhật user profile (write vào master)
   */
  async updateByUserId(userId, updateData) {
    const normalizedData = {
      ...updateData,
      updated_at: new Date(),
    };

    return await this.getMasterDb().where('user_id', userId).update(normalizedData).returning('*');
  }

  /**
   * Xóa user profile (write vào master)
   */
  async deleteByUserId(userId) {
    return await this.getMasterDb().where('user_id', userId).del();
  }

  /**
   * Lấy user với profile (read từ slave)
   */
  async findUserWithProfile(userId) {
    return await this.getSlaveDb()
      .select(
        'users.*',
        'user_profiles.bio',
        'user_profiles.avatar_url',
        'user_profiles.date_of_birth',
        'user_profiles.gender',
        'user_profiles.address',
        'user_profiles.preferences'
      )
      .leftJoin('user_profiles', 'users.id', 'user_profiles.user_id')
      .where('users.id', userId)
      .first();
  }
}

export default UserProfileRepository;
