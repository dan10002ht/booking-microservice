/**
 * Test Registration Flows
 *
 * This file demonstrates how to use the new registration endpoints
 * for both email/password and OAuth registration.
 */

import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load protobuf definition
const PROTO_PATH = path.join(__dirname, 'src', 'proto', 'auth.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const authProto = grpc.loadPackageDefinition(packageDefinition).auth;

// Create gRPC client
const client = new authProto.AuthService('localhost:50051', grpc.credentials.createInsecure());

/**
 * Test Email Registration
 */
async function testEmailRegistration() {
  console.log('\n=== Testing Email Registration ===');

  const emailData = {
    email: 'test@example.com',
    password: 'securePassword123',
    first_name: 'John',
    last_name: 'Doe',
    phone: '+1234567890',
    role: 'user',
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0 (Test Browser)',
  };

  try {
    const result = await new Promise((resolve, reject) => {
      client.registerWithEmail(emailData, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    });

    console.log('✅ Email Registration Success:');
    console.log('  - User ID:', result.user.id);
    console.log('  - Email:', result.user.email);
    console.log('  - Auth Type:', result.auth_type);
    console.log('  - Access Token:', result.access_token ? '✅' : '❌');
    console.log('  - Message:', result.message);

    return result;
  } catch (error) {
    console.error('❌ Email Registration Failed:', error.message);
    return null;
  }
}

/**
 * Test OAuth Registration (Google)
 */
async function testOAuthRegistration() {
  console.log('\n=== Testing OAuth Registration (Google) ===');

  // Note: In real implementation, you would get these from Google OAuth flow
  const oauthData = {
    provider: 'google',
    token: 'mock_google_token_123',
    access_token: 'mock_access_token_456',
    refresh_token: 'mock_refresh_token_789',
    expires_at: Date.now() + 3600000, // 1 hour from now
    ip_address: '192.168.1.2',
    user_agent: 'Mozilla/5.0 (OAuth Test Browser)',
  };

  try {
    const result = await new Promise((resolve, reject) => {
      client.registerWithOAuth(oauthData, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    });

    console.log('✅ OAuth Registration Success:');
    console.log('  - User ID:', result.user.id);
    console.log('  - Email:', result.user.email);
    console.log('  - Auth Type:', result.auth_type);
    console.log('  - Is New User:', result.is_new_user);
    console.log('  - Access Token:', result.access_token ? '✅' : '❌');
    console.log('  - Message:', result.message);

    return result;
  } catch (error) {
    console.error('❌ OAuth Registration Failed:', error.message);
    return null;
  }
}

/**
 * Test Legacy Registration (backward compatibility)
 */
async function testLegacyRegistration() {
  console.log('\n=== Testing Legacy Registration ===');

  const legacyData = {
    email: 'legacy@example.com',
    password: 'legacyPassword123',
    first_name: 'Legacy',
    last_name: 'User',
    role: 'user',
  };

  try {
    const result = await new Promise((resolve, reject) => {
      client.register(legacyData, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    });

    console.log('✅ Legacy Registration Success:');
    console.log('  - User ID:', result.user.id);
    console.log('  - Email:', result.user.email);
    console.log('  - Auth Type:', result.auth_type);
    console.log('  - Message:', result.message);

    return result;
  } catch (error) {
    console.error('❌ Legacy Registration Failed:', error.message);
    return null;
  }
}

/**
 * Test Duplicate Email Registration
 */
async function testDuplicateEmailRegistration() {
  console.log('\n=== Testing Duplicate Email Registration ===');

  const duplicateData = {
    email: 'test@example.com', // Same email as first test
    password: 'anotherPassword123',
    first_name: 'Duplicate',
    last_name: 'User',
    role: 'user',
  };

  try {
    const result = await new Promise((resolve, reject) => {
      client.registerWithEmail(duplicateData, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    });

    console.log('❌ Duplicate Registration Should Have Failed');
    return result;
  } catch (error) {
    console.log('✅ Duplicate Registration Correctly Failed:');
    console.log('  - Error:', error.message);
    return null;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Registration Flow Tests...\n');

  // Test 1: Email Registration
  await testEmailRegistration();

  // Test 2: OAuth Registration
  await testOAuthRegistration();

  // Test 3: Legacy Registration
  await testLegacyRegistration();

  // Test 4: Duplicate Email
  await testDuplicateEmailRegistration();

  console.log('\n🏁 All tests completed!');

  // Close client connection
  client.close();
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export {
  testEmailRegistration,
  testOAuthRegistration,
  testLegacyRegistration,
  testDuplicateEmailRegistration,
  runAllTests,
};
