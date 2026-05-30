/**
 * Example: Using the Evaluation Framework
 *
 * This file demonstrates practical examples of using the evaluation framework
 * for different types of services and components.
 */

import { EvaluationRunner, assertions, PerformanceMonitor } from "./evaluation";
import { globalTracer, traceAsync, createLogger } from "./tracing";

// Example 1: Evaluating a Simple Service
// ========================================

interface SimpleInput {
  value: number;
}

interface SimpleOutput {
  result: number;
  status: string;
}

async function simpleService(input: SimpleInput): Promise<SimpleOutput> {
  return traceAsync(
    "simpleService",
    async () => {
      // Simulate async work
      await new Promise((resolve) => setTimeout(resolve, 10));

      return {
        result: input.value * 2,
        status: "success",
      };
    },
    { inputValue: input.value },
  );
}

export async function evaluateSimpleService() {
  const evaluator = new EvaluationRunner(simpleService, "SimpleService");

  const testCases = [
    {
      name: "Positive number",
      input: { value: 5 },
      expectedOutput: { result: 10, status: "success" },
      validator: (output: SimpleOutput, expected?: SimpleOutput) => {
        return (
          output.result === expected?.result && output.status === "success"
        );
      },
    },
    {
      name: "Zero",
      input: { value: 0 },
      expectedOutput: { result: 0, status: "success" },
      validator: (output: SimpleOutput, expected?: SimpleOutput) => {
        return output.result === expected?.result;
      },
    },
    {
      name: "Negative number",
      input: { value: -3 },
      expectedOutput: { result: -6, status: "success" },
      validator: (output: SimpleOutput, expected?: SimpleOutput) => {
        return output.result === expected?.result;
      },
    },
  ];

  const results = await evaluator.runTests(testCases);
  const summary = evaluator.getSummary();

  console.log("Simple Service Evaluation:");
  console.log(`✅ Passed: ${summary.passedTests}/${summary.totalTests}`);
  console.log(`⚡ Success Rate: ${summary.successRate}%`);
  console.log(`⏱️  Avg Duration: ${summary.avgDuration}ms`);

  return summary;
}

// Example 2: Evaluating an API Service
// =====================================

interface ApiInput {
  endpoint: string;
  params?: Record<string, any>;
}

interface ApiOutput {
  data: any;
  statusCode: number;
  headers?: Record<string, string>;
}

async function apiService(input: ApiInput): Promise<ApiOutput> {
  const logger = createLogger("ApiService");

  return traceAsync(
    "apiService.fetch",
    async () => {
      logger.info("fetch", `Fetching from ${input.endpoint}`, input.params);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Mock response
      const response: ApiOutput = {
        data: { message: "Success", params: input.params },
        statusCode: 200,
        headers: { "content-type": "application/json" },
      };

      logger.info("fetch", "Request completed", {
        statusCode: response.statusCode,
      });
      return response;
    },
    { endpoint: input.endpoint },
  );
}

export async function evaluateApiService() {
  const evaluator = new EvaluationRunner(apiService, "ApiService");
  const perfMonitor = new PerformanceMonitor();

  const testCases = [
    {
      name: "GET request",
      input: { endpoint: "/api/users", params: { page: 1 } },
      validator: (output: ApiOutput) => {
        return (
          assertions.isDefined(output) &&
          assertions.meetsThreshold(output.statusCode, 200, "eq") &&
          assertions.hasProperties(output, ["data", "statusCode"])
        );
      },
    },
    {
      name: "POST request",
      input: { endpoint: "/api/posts", params: { title: "Test" } },
      validator: (output: ApiOutput) => {
        return output.statusCode >= 200 && output.statusCode < 300;
      },
    },
  ];

  // Track performance
  for (const testCase of testCases) {
    const end = perfMonitor.start(`api-${testCase.name}`);
    await evaluator.runTest(testCase);
    end();
  }

  const summary = evaluator.getSummary();
  const metrics = evaluator.getMetrics();
  const perfStats = perfMonitor.getAllStats();

  console.log("\nAPI Service Evaluation:");
  console.log(`✅ Passed: ${summary.passedTests}/${summary.totalTests}`);
  console.log(`📊 Metrics:`);
  console.log(`   - Accuracy: ${(metrics.accuracy! * 100).toFixed(1)}%`);
  console.log(`   - Latency: ${metrics.latency!.toFixed(2)}ms`);
  console.log(`   - Throughput: ${metrics.throughput!.toFixed(2)} req/s`);
  console.log(`\n⚡ Performance Stats:`);
  Object.entries(perfStats).forEach(([label, stats]) => {
    if (stats) {
      console.log(`   ${label}:`);
      console.log(`     - Mean: ${stats.mean}ms`);
      console.log(`     - P95: ${stats.p95}ms`);
    }
  });

  return { summary, metrics, perfStats };
}

// Example 3: Evaluating with Custom Validators
// =============================================

interface ValidationInput {
  email: string;
  age: number;
  tags: string[];
}

interface ValidationOutput {
  valid: boolean;
  errors: string[];
}

async function validationService(
  input: ValidationInput,
): Promise<ValidationOutput> {
  const errors: string[] = [];

  // Email validation
  if (!assertions.matchesPattern(input.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push("Invalid email format");
  }

  // Age validation
  if (!assertions.inRange(input.age, 0, 120)) {
    errors.push("Age must be between 0 and 120");
  }

  // Tags validation
  if (!assertions.hasLength(input.tags, 1, 5)) {
    errors.push("Must have 1-5 tags");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function evaluateValidationService() {
  const evaluator = new EvaluationRunner(
    validationService,
    "ValidationService",
  );

  const testCases = [
    {
      name: "Valid input",
      input: {
        email: "user@example.com",
        age: 25,
        tags: ["javascript", "react"],
      },
      validator: (output: ValidationOutput) => {
        return output.valid && output.errors.length === 0;
      },
    },
    {
      name: "Invalid email",
      input: {
        email: "invalid-email",
        age: 25,
        tags: ["javascript"],
      },
      validator: (output: ValidationOutput) => {
        return !output.valid && output.errors.some((e) => e.includes("email"));
      },
    },
    {
      name: "Invalid age",
      input: {
        email: "user@example.com",
        age: 150,
        tags: ["javascript"],
      },
      validator: (output: ValidationOutput) => {
        return !output.valid && output.errors.some((e) => e.includes("Age"));
      },
    },
    {
      name: "Too many tags",
      input: {
        email: "user@example.com",
        age: 25,
        tags: ["a", "b", "c", "d", "e", "f"],
      },
      validator: (output: ValidationOutput) => {
        return !output.valid && output.errors.some((e) => e.includes("tags"));
      },
    },
  ];

  const results = await evaluator.runTests(testCases);
  const summary = evaluator.getSummary();

  console.log("\nValidation Service Evaluation:");
  console.log(`✅ Passed: ${summary.passedTests}/${summary.totalTests}`);
  console.log(`📊 Success Rate: ${summary.successRate}%`);

  // Show failed tests
  const failedTests = results.filter((r) => !r.passed);
  if (failedTests.length > 0) {
    console.log("\n❌ Failed Tests:");
    failedTests.forEach((test) => {
      console.log(`   - ${test.testName}`);
      if (test.error) {
        console.log(`     Error: ${test.error}`);
      }
    });
  }

  return summary;
}

// Example 4: Parallel Evaluation for Performance
// ==============================================

interface ParallelInput {
  id: number;
}

interface ParallelOutput {
  id: number;
  processed: boolean;
  timestamp: number;
}

async function parallelService(input: ParallelInput): Promise<ParallelOutput> {
  // Simulate variable processing time
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

  return {
    id: input.id,
    processed: true,
    timestamp: Date.now(),
  };
}

export async function evaluateParallelService() {
  const evaluator = new EvaluationRunner(parallelService, "ParallelService");

  // Generate 20 test cases
  const testCases = Array.from({ length: 20 }, (_, i) => ({
    name: `Process item ${i}`,
    input: { id: i },
    validator: (output: ParallelOutput) => {
      return output.processed && output.id === i;
    },
  }));

  console.log("\nParallel Service Evaluation:");
  console.log("Running 20 tests in parallel...");

  const startTime = performance.now();
  const results = await evaluator.runTestsParallel(testCases);
  const duration = performance.now() - startTime;

  const summary = evaluator.getSummary();
  const metrics = evaluator.getMetrics();

  console.log(`✅ Completed in ${duration.toFixed(2)}ms`);
  console.log(`✅ Passed: ${summary.passedTests}/${summary.totalTests}`);
  console.log(`⚡ Throughput: ${metrics.throughput!.toFixed(2)} tests/sec`);
  console.log(`⏱️  Avg Latency: ${metrics.latency!.toFixed(2)}ms`);

  return summary;
}

// Example 5: Comprehensive Evaluation with Tracing
// ================================================

export async function runComprehensiveEvaluation() {
  console.log("🚀 Starting Comprehensive Evaluation\n");
  console.log("=".repeat(50));

  // Clear previous traces
  globalTracer.clear();

  // Run all evaluations
  await evaluateSimpleService();
  console.log("\n" + "=".repeat(50));

  await evaluateApiService();
  console.log("\n" + "=".repeat(50));

  await evaluateValidationService();
  console.log("\n" + "=".repeat(50));

  await evaluateParallelService();
  console.log("\n" + "=".repeat(50));

  // Show overall tracing stats
  const traceStats = globalTracer.getStats();
  console.log("\n📊 Overall Tracing Statistics:");
  console.log(`   - Total Spans: ${traceStats.totalSpans}`);
  console.log(`   - Completed: ${traceStats.completedSpans}`);
  console.log(`   - Total Events: ${traceStats.totalEvents}`);
  console.log(`   - Errors: ${traceStats.errorCount}`);
  console.log(`   - Error Rate: ${(traceStats.errorRate * 100).toFixed(2)}%`);
  console.log(`   - Total Duration: ${traceStats.totalDuration.toFixed(2)}ms`);

  // Export all data
  const traceExport = globalTracer.export();
  console.log("\n💾 Trace data exported and ready for analysis");

  return traceExport;
}

// Export for use in tests or console
if (typeof window !== "undefined") {
  (window as any).evaluationExamples = {
    evaluateSimpleService,
    evaluateApiService,
    evaluateValidationService,
    evaluateParallelService,
    runComprehensiveEvaluation,
  };
}
