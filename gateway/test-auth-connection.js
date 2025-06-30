import grpcClients from './src/grpc/clients.js';

async function testAuthConnection() {
  console.log('🔍 Testing Gateway -> Auth-Service Connection...\n');

  try {
    // Test health check
    console.log('1. Testing Health Check...');
    if (grpcClients.authService && grpcClients.authService.health) {
      const healthResult = await grpcClients.authService.health({});
      console.log('✅ Health check successful:', healthResult);
    } else {
      console.log('❌ Health method not available');
    }

    // Test register
    console.log('\n2. Testing Register...');
    if (grpcClients.authService && grpcClients.authService.register) {
      const registerRequest = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        correlationId: 'test-123',
      };

      const registerResult = await grpcClients.authService.register(registerRequest);
      console.log('✅ Register successful:', registerResult);
    } else {
      console.log('❌ Register method not available');
    }

    // Test login
    console.log('\n3. Testing Login...');
    if (grpcClients.authService && grpcClients.authService.login) {
      const loginRequest = {
        email: 'test@example.com',
        password: 'password123',
        correlationId: 'test-456',
      };

      const loginResult = await grpcClients.authService.login(loginRequest);
      console.log('✅ Login successful:', loginResult);
    } else {
      console.log('❌ Login method not available');
    }

    // Test validate token
    console.log('\n4. Testing Validate Token...');
    if (grpcClients.authService && grpcClients.authService.validateToken) {
      const validateRequest = {
        token: 'test-token',
        correlationId: 'test-789',
      };

      const validateResult = await grpcClients.authService.validateToken(validateRequest);
      console.log('✅ Validate token successful:', validateResult);
    } else {
      console.log('❌ ValidateToken method not available');
    }

    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAuthConnection();
