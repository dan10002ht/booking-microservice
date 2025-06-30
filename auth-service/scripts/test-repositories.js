#!/usr/bin/env node

import { getAllRepositories } from '../src/repositories/repositoryFactory.js';
import RepositoryValidator from '../src/repositories/validators/repositoryValidator.js';
import logger from '../src/utils/logger.js';

/**
 * Test script để validate tất cả repositories
 */
async function testRepositories() {
  console.log('🚀 Starting repository validation...\n');

  try {
    // Lấy tất cả repository instances
    const repositories = getAllRepositories();

    console.log('📋 Found repositories:', Object.keys(repositories));
    console.log('');

    // Validate tất cả repositories
    const isValid = RepositoryValidator.validateAllRepositories(repositories);

    if (!isValid) {
      console.error('\n❌ Repository validation failed!');
      process.exit(1);
    }

    console.log('\n🧪 Testing repository methods...');

    // Test basic methods của từng repository
    const testResults = [];

    for (const [name, repository] of Object.entries(repositories)) {
      const result = await RepositoryValidator.testRepositoryMethods(
        repository,
        `${name.charAt(0).toUpperCase() + name.slice(1)}Repository`
      );
      testResults.push({ name, result });
    }

    // Check test results
    const failedTests = testResults.filter((r) => !r.result);

    if (failedTests.length > 0) {
      console.error('\n❌ Some repository tests failed:');
      failedTests.forEach((test) => {
        console.error(`  - ${test.name}Repository`);
      });
      process.exit(1);
    }

    console.log('\n🎉 All repositories are valid and working correctly!');
    console.log('✅ Interface compliance: PASSED');
    console.log('✅ Method implementation: PASSED');
    console.log('✅ Database connectivity: PASSED');
  } catch (error) {
    console.error('\n❌ Repository validation error:', error.message);
    logger.error('Repository validation failed:', error);
    process.exit(1);
  }
}

// Run the test
testRepositories();
