import {
  getUserRepository,
  getUserProfileRepository,
} from '../../repositories/repositoryFactory.js';

// Get repository instances
const userRepository = getUserRepository();
const userProfileRepository = getUserProfileRepository();

/**
 * Lấy user profile với thông tin chi tiết
 */
export async function getUserProfile(userId) {
  return await userProfileRepository.findUserWithProfile(userId);
}

/**
 * Lấy user statistics
 */
export async function getUserStats(userId) {
  const [user, totalBookings, totalSpent] = await Promise.all([
    userRepository.findByPublicId(userId),
    userRepository.getSlaveDb()('bookings').where('user_id', userId).count('* as total').first(),
    userRepository
      .getSlaveDb()('payments')
      .where('user_id', userId)
      .where('status', 'completed')
      .sum('amount as total')
      .first(),
  ]);

  return {
    user,
    stats: {
      totalBookings: parseInt(totalBookings?.total || 0),
      totalSpent: parseFloat(totalSpent?.total || 0),
    },
  };
}

/**
 * Hard delete user và tất cả related data
 */
export async function hardDeleteUser(userId) {
  // First get the internal id from public_id
  const user = await userRepository.findByPublicId(userId);
  if (!user) {
    throw new Error('User not found');
  }

  return await userRepository.transaction(async (trx) => {
    // Xóa user sessions
    await trx('user_sessions').where('user_id', user.id).del();

    // Xóa user profiles
    await trx('user_profiles').where('user_id', user.id).del();

    // Xóa user roles
    await trx('user_roles').where('user_id', user.id).del();

    // Xóa refresh tokens
    await trx('refresh_tokens').where('user_id', user.id).del();

    // Xóa password reset tokens
    await trx('password_reset_tokens').where('user_id', user.id).del();

    // Xóa email verification tokens
    await trx('email_verification_tokens').where('user_id', user.id).del();

    // Xóa OAuth accounts
    await trx('oauth_accounts').where('user_id', user.id).del();

    // Xóa organizations
    await trx('organizations').where('user_id', user.id).del();

    // Cuối cùng xóa user
    return await trx('users').where('id', user.id).del().returning('*');
  });
}

/**
 * Bulk delete users và tất cả related data
 */
export async function bulkDeleteUsers(userIds) {
  // First get the internal ids from public_ids
  const users = await userRepository
    .getSlaveDb()
    .select('id')
    .from('users')
    .whereIn('public_id', userIds);

  const internalIds = users.map((user) => user.id);

  return await userRepository.transaction(async (trx) => {
    // Xóa user sessions
    await trx('user_sessions').whereIn('user_id', internalIds).del();

    // Xóa user profiles
    await trx('user_profiles').whereIn('user_id', internalIds).del();

    // Xóa user roles
    await trx('user_roles').whereIn('user_id', internalIds).del();

    // Xóa refresh tokens
    await trx('refresh_tokens').whereIn('user_id', internalIds).del();

    // Xóa password reset tokens
    await trx('password_reset_tokens').whereIn('user_id', internalIds).del();

    // Xóa email verification tokens
    await trx('email_verification_tokens').whereIn('user_id', internalIds).del();

    // Xóa OAuth accounts
    await trx('oauth_accounts').whereIn('user_id', internalIds).del();

    // Xóa organizations
    await trx('organizations').whereIn('user_id', internalIds).del();

    // Cuối cùng xóa users
    return await trx('users').whereIn('id', internalIds).del().returning('*');
  });
}
