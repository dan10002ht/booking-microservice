import IRepository from '../interfaces/IRepository.js';
import IUserRepository from '../interfaces/IUserRepository.js';

/**
 * Repository Validator
 * Kiểm tra xem repositories có implement đúng interface không
 */
export class RepositoryValidator {
  /**
   * Validate base repository interface
   * @param {Object} repository - Repository instance
   * @param {string} repositoryName - Repository name for error messages
   * @returns {boolean}
   */
  static validateBaseRepository(repository, repositoryName = 'Repository') {
    const requiredMethods = [
      'findAll',
      'findById',
      'findByPublicId',
      'findOne',
      'findMany',
      'count',
      'exists',
      'create',
      'createMany',
      'updateById',
      'updateByPublicId',
      'update',
      'deleteById',
      'deleteByPublicId',
      'delete',
      'upsert',
      'transaction',
      'rawQuery',
      'join',
      'paginate',
    ];

    const missingMethods = [];

    for (const method of requiredMethods) {
      if (typeof repository[method] !== 'function') {
        missingMethods.push(method);
      }
    }

    if (missingMethods.length > 0) {
      console.error(`❌ ${repositoryName} missing methods:`, missingMethods);
      return false;
    }

    console.log(`✅ ${repositoryName} implements all base repository methods`);
    return true;
  }

  /**
   * Validate user repository interface
   * @param {Object} repository - UserRepository instance
   * @returns {boolean}
   */
  static validateUserRepository(repository) {
    // First validate base repository
    if (!this.validateBaseRepository(repository, 'UserRepository')) {
      return false;
    }

    const requiredUserMethods = [
      'findByEmail',
      'findByPhone',
      'findActiveUsers',
      'findByStatus',
      'searchUsers',
      'findWithRoles',
      'findWithOrganization',
      'createUser',
      'updateUser',
      'updatePassword',
      'updateUserStatus',
      'updateLastLogin',
      'softDeleteUser',
      'hardDeleteUser',
      'verifyPassword',
      'verifyCredentials',
      'bulkUpdateUsers',
      'bulkDeleteUsers',
    ];

    const missingMethods = [];

    for (const method of requiredUserMethods) {
      if (typeof repository[method] !== 'function') {
        missingMethods.push(method);
      }
    }

    if (missingMethods.length > 0) {
      console.error('❌ UserRepository missing methods:', missingMethods);
      return false;
    }

    console.log('✅ UserRepository implements all user-specific methods');
    return true;
  }

  /**
   * Validate all repositories
   * @param {Object} repositories - Object containing all repository instances
   * @returns {boolean}
   */
  static validateAllRepositories(repositories) {
    console.log('🔍 Validating all repositories...');

    let allValid = true;

    // Validate base repositories
    const baseRepositories = [
      'role',
      'userRole',
      'permission',
      'refreshToken',
      'passwordResetToken',
      'emailVerificationToken',
      'userSession',
      'userProfile',
      'oauthAccount',
      'organization',
    ];

    for (const repoName of baseRepositories) {
      if (repositories[repoName]) {
        const isValid = this.validateBaseRepository(
          repositories[repoName],
          `${repoName.charAt(0).toUpperCase() + repoName.slice(1)}Repository`
        );
        if (!isValid) allValid = false;
      }
    }

    // Validate user repository specifically
    if (repositories.user) {
      const isValid = this.validateUserRepository(repositories.user);
      if (!isValid) allValid = false;
    }

    if (allValid) {
      console.log('🎉 All repositories are valid!');
    } else {
      console.error('❌ Some repositories are invalid!');
    }

    return allValid;
  }

  /**
   * Test repository methods
   * @param {Object} repository - Repository instance
   * @param {string} repositoryName - Repository name
   * @returns {Promise<boolean>}
   */
  static async testRepositoryMethods(repository, repositoryName = 'Repository') {
    console.log(`🧪 Testing ${repositoryName} methods...`);

    try {
      // Test basic methods
      await repository.findAll({ limit: 1 });
      await repository.count();

      console.log(`✅ ${repositoryName} basic methods work correctly`);
      return true;
    } catch (error) {
      console.error(`❌ ${repositoryName} test failed:`, error.message);
      return false;
    }
  }
}

export default RepositoryValidator;
