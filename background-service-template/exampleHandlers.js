import logger from "./logger.js";

/**
 * Example job handlers for testing the background service
 * These are simple handlers to demonstrate the functionality
 */

// ========== BASIC EXAMPLE HANDLERS ==========

/**
 * Hello World job handler - Basic example
 */
export async function helloWorldHandler(data, job) {
  logger.info(`Processing hello world job ${job.id}`, {
    message: data.message || "Hello World!",
    timestamp: new Date().toISOString(),
  });

  try {
    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.info(`Hello world job ${job.id} completed successfully`);
    return {
      success: true,
      message: data.message || "Hello World!",
      processedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`Failed to process hello world job ${job.id}:`, error);
    throw error;
  }
}

/**
 * Simple calculation job handler
 */
export async function calculationHandler(data, job) {
  logger.info(`Processing calculation job ${job.id}`, {
    operation: data.operation,
    numbers: data.numbers,
  });

  try {
    // Simulate calculation work
    await new Promise((resolve) => setTimeout(resolve, 500));

    let result;
    switch (data.operation) {
      case "add":
        result = data.numbers.reduce((sum, num) => sum + num, 0);
        break;
      case "multiply":
        result = data.numbers.reduce((product, num) => product * num, 1);
        break;
      case "average":
        result =
          data.numbers.reduce((sum, num) => sum + num, 0) / data.numbers.length;
        break;
      default:
        throw new Error(`Unknown operation: ${data.operation}`);
    }

    logger.info(`Calculation job ${job.id} completed successfully`, { result });
    return {
      success: true,
      operation: data.operation,
      numbers: data.numbers,
      result,
      calculatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`Failed to process calculation job ${job.id}:`, error);
    throw error;
  }
}

/**
 * Data processing job handler
 */
export async function dataProcessingHandler(data, job) {
  logger.info(`Processing data job ${job.id}`, {
    dataType: data.dataType,
    recordCount: data.records?.length || 0,
  });

  try {
    // Simulate data processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const processedRecords =
      data.records?.map((record) => ({
        ...record,
        processed: true,
        processedAt: new Date().toISOString(),
      })) || [];

    logger.info(`Data processing job ${job.id} completed successfully`, {
      processedCount: processedRecords.length,
    });

    return {
      success: true,
      dataType: data.dataType,
      originalCount: data.records?.length || 0,
      processedCount: processedRecords.length,
      processedRecords,
      processedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`Failed to process data job ${job.id}:`, error);
    throw error;
  }
}

/**
 * Notification job handler
 */
export async function notificationHandler(data, job) {
  logger.info(`Processing notification job ${job.id}`, {
    type: data.type,
    recipient: data.recipient,
  });

  try {
    // Simulate notification sending
    await new Promise((resolve) => setTimeout(resolve, 800));

    logger.info(`Notification job ${job.id} completed successfully`);
    return {
      success: true,
      type: data.type,
      recipient: data.recipient,
      message: data.message,
      sentAt: new Date().toISOString(),
      notificationId: `notif_${Date.now()}`,
    };
  } catch (error) {
    logger.error(`Failed to process notification job ${job.id}:`, error);
    throw error;
  }
}

/**
 * Cleanup job handler
 */
export async function cleanupHandler(data, job) {
  logger.info(`Processing cleanup job ${job.id}`, {
    target: data.target,
    criteria: data.criteria,
  });

  try {
    // Simulate cleanup work
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const deletedCount = Math.floor(Math.random() * 100) + 1; // Random 1-100

    logger.info(`Cleanup job ${job.id} completed successfully`, {
      deletedCount,
    });
    return {
      success: true,
      target: data.target,
      criteria: data.criteria,
      deletedCount,
      cleanedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`Failed to process cleanup job ${job.id}:`, error);
    throw error;
  }
}

/**
 * Report generation job handler
 */
export async function reportGenerationHandler(data, job) {
  logger.info(`Processing report generation job ${job.id}`, {
    reportType: data.reportType,
    dateRange: data.dateRange,
  });

  try {
    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 3000));

    logger.info(`Report generation job ${job.id} completed successfully`);
    return {
      success: true,
      reportType: data.reportType,
      dateRange: data.dateRange,
      reportId: `report_${Date.now()}`,
      reportUrl: `/reports/${data.reportType}_${Date.now()}.pdf`,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`Failed to process report generation job ${job.id}:`, error);
    throw error;
  }
}

// ========== ERROR TESTING HANDLERS ==========

/**
 * Handler that sometimes fails - for testing retry mechanism
 */
export async function unreliableHandler(data, job) {
  logger.info(`Processing unreliable job ${job.id}`, {
    shouldFail: data.shouldFail,
    failureRate: data.failureRate || 0.3,
  });

  try {
    // Simulate work
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Randomly fail based on failure rate
    const shouldFail =
      data.shouldFail || Math.random() < (data.failureRate || 0.3);

    if (shouldFail) {
      throw new Error(`Simulated failure for job ${job.id}`);
    }

    logger.info(`Unreliable job ${job.id} completed successfully`);
    return {
      success: true,
      message: "Lucky! This one succeeded!",
      processedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`Unreliable job ${job.id} failed as expected:`, error);
    throw error;
  }
}

/**
 * Handler that takes a long time - for testing timeout
 */
export async function slowHandler(data, job) {
  logger.info(`Processing slow job ${job.id}`, {
    duration: data.duration || 10000,
  });

  try {
    // Simulate slow work
    await new Promise((resolve) => setTimeout(resolve, data.duration || 10000));

    logger.info(`Slow job ${job.id} completed successfully`);
    return {
      success: true,
      duration: data.duration || 10000,
      completedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`Slow job ${job.id} failed:`, error);
    throw error;
  }
}

// ========== JOB HANDLER REGISTRY ==========

/**
 * Register all example job handlers with the background service
 */
export function registerExampleHandlers(backgroundService) {
  const handlers = {
    // Basic handlers
    "hello-world": helloWorldHandler,
    calculation: calculationHandler,
    "data-processing": dataProcessingHandler,
    notification: notificationHandler,
    cleanup: cleanupHandler,
    "report-generation": reportGenerationHandler,

    // Testing handlers
    unreliable: unreliableHandler,
    slow: slowHandler,
  };

  // Register all handlers
  for (const [jobType, handler] of Object.entries(handlers)) {
    backgroundService.registerHandler(jobType, handler);
  }

  logger.info(
    `Registered ${Object.keys(handlers).length} example job handlers`
  );
}

export default {
  registerExampleHandlers,
  helloWorldHandler,
  calculationHandler,
  dataProcessingHandler,
  notificationHandler,
  cleanupHandler,
  reportGenerationHandler,
  unreliableHandler,
  slowHandler,
};
