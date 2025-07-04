/**
 * Test PIN Code Verification via gRPC
 *
 * This script tests the PIN code verification flow:
 * 1. Send verification email with PIN code
 * 2. Verify email with PIN code
 * 3. Resend verification email
 */

import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load protobuf definition
const PROTO_PATH = path.join(__dirname, '..', 'shared-lib', 'protos', 'auth.proto');

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
 * Test Send Verification Email
 */
async function testSendVerificationEmail() {
  console.log('\n=== Testing Send Verification Email ===');

  const emailData = {
    email: 'test@example.com',
  };

  try {
    const result = await new Promise((resolve, reject) => {
      client.sendVerificationEmail(emailData, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    });

    console.log('✅ Send Verification Email Success:');
    console.log('  - Success:', result.success);
    console.log('  - Message:', result.message);
    console.log('  - User ID:', result.user_id);
    console.log('  - User Email:', result.user_email);
    console.log('  - PIN Code (dev):', result.pin_code || 'hidden');
    console.log('  - Expires At:', result.expires_at);

    return result;
  } catch (error) {
    console.error('❌ Send Verification Email Failed:', error.message);
    return null;
  }
}

/**
 * Test Verify Email with PIN Code
 */
async function testVerifyEmailWithPin(userId, pinCode) {
  console.log('\n=== Testing Verify Email with PIN Code ===');

  const verifyData = {
    user_id: userId,
    pin_code: pinCode,
  };

  try {
    const result = await new Promise((resolve, reject) => {
      client.verifyEmailWithPin(verifyData, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    });

    console.log('✅ Verify Email with PIN Success:');
    console.log('  - Success:', result.success);
    console.log('  - Message:', result.message);
    if (result.user) {
      console.log('  - User ID:', result.user.id);
      console.log('  - Email:', result.user.email);
      console.log('  - Is Verified:', result.user.is_verified);
    }

    return result;
  } catch (error) {
    console.error('❌ Verify Email with PIN Failed:', error.message);
    return null;
  }
}

/**
 * Test Resend Verification Email
 */
async function testResendVerificationEmail() {
  console.log('\n=== Testing Resend Verification Email ===');

  const emailData = {
    email: 'test@example.com',
  };

  try {
    const result = await new Promise((resolve, reject) => {
      client.resendVerificationEmail(emailData, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    });

    console.log('✅ Resend Verification Email Success:');
    console.log('  - Success:', result.success);
    console.log('  - Message:', result.message);
    console.log('  - User ID:', result.user_id);
    console.log('  - User Email:', result.user_email);
    console.log('  - PIN Code (dev):', result.pin_code || 'hidden');
    console.log('  - Expires At:', result.expires_at);

    return result;
  } catch (error) {
    console.error('❌ Resend Verification Email Failed:', error.message);
    return null;
  }
}

/**
 * Test Invalid PIN Code
 */
async function testInvalidPinCode(userId) {
  console.log('\n=== Testing Invalid PIN Code ===');

  const verifyData = {
    user_id: userId,
    pin_code: '000000', // Invalid PIN
  };

  try {
    const result = await new Promise((resolve, reject) => {
      client.verifyEmailWithPin(verifyData, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    });

    console.log('❌ Invalid PIN Code Test Failed (expected):');
    console.log('  - Success:', result.success);
    console.log('  - Message:', result.message);

    return result;
  } catch (error) {
    console.log('✅ Invalid PIN Code Test Passed (expected error):');
    console.log('  - Error:', error.message);
    return null;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting PIN Code Verification Tests...\n');

  // Test 1: Send verification email
  const sendResult = await testSendVerificationEmail();
  if (!sendResult || !sendResult.success) {
    console.log('❌ Cannot continue tests - send verification email failed');
    return;
  }

  // Wait a moment for background processing
  console.log('\n⏳ Waiting for background job processing...');
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 2: Verify with correct PIN code
  if (sendResult.pin_code) {
    await testVerifyEmailWithPin(sendResult.user_id, sendResult.pin_code);
  } else {
    console.log('⚠️  Skipping PIN verification test - PIN code not available in response');
  }

  // Test 3: Test invalid PIN code
  await testInvalidPinCode(sendResult.user_id);

  // Test 4: Resend verification email
  await testResendVerificationEmail();

  console.log('\n✅ All PIN Code Verification Tests Completed!');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export {
  testSendVerificationEmail,
  testVerifyEmailWithPin,
  testResendVerificationEmail,
  testInvalidPinCode,
  runAllTests,
};
