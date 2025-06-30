import { getUserRepository } from '../../repositories/repositoryFactory.js';
import { sanitizeUserForResponse } from '../../utils/sanitizers.js';

// Get user repository instance from factory
const userRepository = getUserRepository();

// ========== ADMIN USER MANAGEMENT ==========

/**
 * Update user status (admin)
 */
export async function updateUserStatus(userId, status) {
  try {
    const updatedUser = await userRepository.updateUserStatus(userId, status);

    // If user is locked, delete all sessions
    if (status === 'suspended' || status === 'deleted') {
      await userRepository.deleteAllUserSessions(userId);
    }

    return sanitizeUserForResponse(updatedUser);
  } catch (error) {
    throw new Error(`Failed to update status: ${error.message}`);
  }
}

/**
 * Reset password (for admin)
 */
export async function resetPassword(userId, newPassword) {
  try {
    await userRepository.updatePassword(userId, newPassword);
    await userRepository.deleteAllUserSessions(userId);

    return { message: 'Password reset successful' };
  } catch (error) {
    throw new Error(`Password reset failed: ${error.message}`);
  }
}

/**
 * Get users list (with pagination) - Admin version
 */
export async function getUsers(page = 1, pageSize = 20, filters = {}) {
  try {
    const conditions = {};

    if (filters.status) {
      conditions.status = filters.status;
    }

    if (filters.role) {
      conditions.role = filters.role;
    }

    const options = {
      orderBy: filters.orderBy || 'created_at',
      orderDirection: filters.orderDirection || 'desc',
    };

    return await userRepository.paginate(page, pageSize, conditions, options);
  } catch (error) {
    throw new Error(`Failed to get users list: ${error.message}`);
  }
}

/**
 * Search users - Admin version
 */
export async function searchUsers(searchTerm, page = 1, pageSize = 20) {
  try {
    const offset = (page - 1) * pageSize;
    const users = await userRepository.searchUsers(searchTerm, {
      limit: pageSize,
      offset,
    });

    const total = await userRepository.count({
      // Count with similar search conditions
    });

    return {
      data: users.map((user) => sanitizeUserForResponse(user)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page < Math.ceil(total / pageSize),
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    throw new Error(`Search users failed: ${error.message}`);
  }
}

/**
 * Delete user (admin)
 */
export async function deleteUser(userId) {
  try {
    // Delete all user sessions first
    await userRepository.deleteAllUserSessions(userId);

    // Delete user
    await userRepository.deleteUser(userId);

    return { message: 'User deleted successfully' };
  } catch (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

/**
 * Bulk update user status
 */
export async function bulkUpdateUserStatus(userIds, status) {
  try {
    const results = [];

    for (const userId of userIds) {
      try {
        const result = await updateUserStatus(userId, status);
        results.push({ userId, success: true, result });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    return {
      message: 'Bulk update completed',
      results,
    };
  } catch (error) {
    throw new Error(`Bulk update failed: ${error.message}`);
  }
}
