import { getBackgroundService } from "./backgroundService.js";
import { registerExampleHandlers } from "./exampleHandlers.js";
import logger from "./logger.js";

/**
 * Test script to demonstrate background service functionality
 * Run with: node test.js
 */

async function testBackgroundService() {
  try {
    logger.info("🚀 Starting background service test...");

    // Initialize background service
    const backgroundService = getBackgroundService();
    await backgroundService.initialize();

    // Register example handlers
    registerExampleHandlers(backgroundService);

    // Test 1: Fire and forget operation
    logger.info("\n📝 Test 1: Fire and forget operation");
    const fireAndForgetResult = await backgroundService.fireAndForget(
      async (data) => {
        logger.info("Fire and forget operation executed:", data);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { message: "Fire and forget completed!" };
      },
      { message: "Hello from fire and forget!" },
      { priority: "high" }
    );
    logger.info("Fire and forget result:", fireAndForgetResult);

    // Test 2: Enqueue hello world job
    logger.info("\n📝 Test 2: Enqueue hello world job");
    const helloWorldJob = await backgroundService.enqueueJob(
      "hello-world",
      {
        message: "Hello from background service!",
      },
      { priority: "high" }
    );
    logger.info("Hello world job enqueued:", helloWorldJob);

    // Test 3: Enqueue calculation job
    logger.info("\n📝 Test 3: Enqueue calculation job");
    const calculationJob = await backgroundService.enqueueJob(
      "calculation",
      {
        operation: "add",
        numbers: [1, 2, 3, 4, 5],
      },
      { priority: "normal" }
    );
    logger.info("Calculation job enqueued:", calculationJob);

    // Test 4: Enqueue data processing job
    logger.info("\n📝 Test 4: Enqueue data processing job");
    const dataProcessingJob = await backgroundService.enqueueJob(
      "data-processing",
      {
        dataType: "users",
        records: [
          { id: 1, name: "John" },
          { id: 2, name: "Jane" },
          { id: 3, name: "Bob" },
        ],
      },
      { priority: "normal" }
    );
    logger.info("Data processing job enqueued:", dataProcessingJob);

    // Test 5: Enqueue notification job
    logger.info("\n📝 Test 5: Enqueue notification job");
    const notificationJob = await backgroundService.enqueueJob(
      "notification",
      {
        type: "email",
        recipient: "user@example.com",
        message: "Welcome to our service!",
      },
      { priority: "low" }
    );
    logger.info("Notification job enqueued:", notificationJob);

    // Test 6: Enqueue delayed job
    logger.info("\n📝 Test 6: Enqueue delayed job (5 seconds)");
    const delayedJob = await backgroundService.enqueueJob(
      "hello-world",
      {
        message: "This job was delayed by 5 seconds!",
      },
      {
        priority: "normal",
        delay: 5000, // 5 seconds
      }
    );
    logger.info("Delayed job enqueued:", delayedJob);

    // Test 7: Enqueue unreliable job (for testing retry)
    logger.info("\n📝 Test 7: Enqueue unreliable job (30% failure rate)");
    const unreliableJob = await backgroundService.enqueueJob(
      "unreliable",
      {
        failureRate: 0.3,
      },
      { priority: "low" }
    );
    logger.info("Unreliable job enqueued:", unreliableJob);

    // Test 8: Enqueue slow job (for testing timeout)
    logger.info("\n📝 Test 8: Enqueue slow job (15 seconds)");
    const slowJob = await backgroundService.enqueueJob(
      "slow",
      {
        duration: 15000, // 15 seconds
      },
      {
        priority: "low",
        timeout: 20000, // 20 second timeout
      }
    );
    logger.info("Slow job enqueued:", slowJob);

    // Test 9: Check job status
    logger.info("\n📝 Test 9: Check job status");
    setTimeout(async () => {
      const status = backgroundService.getJobStatus(helloWorldJob.jobId);
      logger.info("Hello world job status:", status);
    }, 2000);

    // Test 10: Get service health
    logger.info("\n📝 Test 10: Get service health");
    setTimeout(async () => {
      const health = await backgroundService.getHealth();
      logger.info("Service health:", health);
    }, 3000);

    // Test 11: Monitor jobs for a while
    logger.info("\n📝 Test 11: Monitoring jobs for 30 seconds...");
    let monitorCount = 0;
    const monitorInterval = setInterval(async () => {
      monitorCount++;
      const health = await backgroundService.getHealth();
      logger.info(
        `Monitor ${monitorCount}: Active jobs: ${health.activeJobs}, Metrics:`,
        health.metrics
      );

      if (monitorCount >= 6) {
        // 30 seconds (6 * 5 seconds)
        clearInterval(monitorInterval);
        logger.info("Monitoring completed");
      }
    }, 5000);

    // Wait for all jobs to complete
    logger.info("\n⏳ Waiting for jobs to complete...");
    await new Promise((resolve) => setTimeout(resolve, 35000));

    // Final health check
    logger.info("\n📊 Final health check");
    const finalHealth = await backgroundService.getHealth();
    logger.info("Final service health:", finalHealth);

    // Graceful shutdown
    logger.info("\n🛑 Shutting down background service...");
    await backgroundService.shutdown();

    logger.info("✅ Background service test completed successfully!");
  } catch (error) {
    logger.error("❌ Background service test failed:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  logger.info("\n🛑 Received SIGINT, shutting down gracefully...");
  const backgroundService = getBackgroundService();
  await backgroundService.shutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("\n🛑 Received SIGTERM, shutting down gracefully...");
  const backgroundService = getBackgroundService();
  await backgroundService.shutdown();
  process.exit(0);
});

// Run the test
testBackgroundService();
