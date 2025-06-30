import circuitBreakerService from './src/services/circuitBreakerService.js';

console.log('🔄 Resetting all circuit breakers...');

// Reset all circuit breakers
circuitBreakerService.resetAllBreakers();

// Get health status after reset
const health = circuitBreakerService.getHealth();
console.log('✅ Circuit breakers reset. Health status:');
console.log(JSON.stringify(health, null, 2));

console.log('\n🎯 All circuit breakers are now closed and ready!');
