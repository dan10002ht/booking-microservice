import { grpcClients } from './src/grpc/clients.js';
import circuitBreakerService from './src/services/circuitBreakerService.js';

console.log('🧪 Testing Circuit Breaker and Deadline Configuration...\n');

// Test 1: Check circuit breaker stats
console.log('📊 Circuit Breaker Statistics:');
const stats = circuitBreakerService.getStats();
console.log(JSON.stringify(stats, null, 2));

// Test 2: Check circuit breaker health
console.log('\n🏥 Circuit Breaker Health:');
const health = circuitBreakerService.getHealth();
console.log(JSON.stringify(health, null, 2));

// Test 3: Test gRPC client with timeout
console.log('\n⏱️  Testing gRPC client timeout...');

async function testGrpcTimeout() {
  const startTime = Date.now();

  try {
    console.log('Sending request to auth service...');

    // Test with a request that should timeout
    const result = await grpcClients.authService.health({
      correlationId: 'test-timeout-' + Date.now(),
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ Request completed in ${duration}ms`);
    console.log('Result:', result);
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`❌ Request failed after ${duration}ms`);
    console.log('Error:', error.message);
    console.log('Error code:', error.code);
    console.log('Error details:', error.details);
  }
}

// Test 4: Test circuit breaker with multiple failures
console.log('\n🔄 Testing Circuit Breaker with multiple failures...');

async function testCircuitBreaker() {
  const testBreaker = circuitBreakerService.createBreaker(
    'test-breaker',
    async () => {
      // Simulate a slow operation that sometimes fails
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (Math.random() > 0.5) {
        throw new Error('Simulated failure');
      }
      return 'success';
    },
    {
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 3000,
      volumeThreshold: 3,
    }
  );

  console.log('Testing circuit breaker with mixed success/failure...');

  for (let i = 0; i < 10; i++) {
    try {
      const result = await testBreaker.fire();
      console.log(`Request ${i + 1}: ✅ Success - ${result}`);
    } catch (error) {
      console.log(`Request ${i + 1}: ❌ Failed - ${error.message}`);
    }

    // Check breaker state
    const breakerStats = testBreaker.stats;
    console.log(
      `  Breaker state: opened=${testBreaker.opened}, total=${breakerStats.totalCount}, errors=${breakerStats.errorCount}`
    );

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

// Test 5: Check gRPC client configuration
console.log('\n🔧 gRPC Client Configuration:');
console.log('Auth Service URL:', process.env.GRPC_AUTH_SERVICE_URL || '127.0.0.1:50051');

// Run tests
async function runTests() {
  try {
    await testGrpcTimeout();
    await testCircuitBreaker();

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

runTests();
