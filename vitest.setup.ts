// vitest.setup.ts - Setup file for Vitest

// Suppress unhandled rejection warnings in test environment
// This is specifically for retry tests where we intentionally trigger promise rejections
process.removeAllListeners("unhandledRejection");
process.on("unhandledRejection", () => {
  // Silently ignore unhandled rejections in test environment
  // These are expected when testing error scenarios with retry logic
});

// Suppress uncaught exception warnings for test scenarios
process.removeAllListeners("uncaughtException");
process.on("uncaughtException", () => {
  // Silently ignore uncaught exceptions in test environment
  // These can occur during fake timer advances with async operations
});
