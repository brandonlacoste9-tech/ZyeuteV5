/**
 * Evaluation Framework for Agent and Service Testing
 * 
 * This module provides utilities for evaluating AI agents, services,
 * and other components in the Zyeuté application.
 */

export interface EvaluationResult {
  testName: string;
  passed: boolean;
  score?: number;
  duration: number;
  error?: string;
  details?: Record<string, any>;
}

export interface EvaluationMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  latency?: number;
  throughput?: number;
  errorRate?: number;
}

export interface TestCase<Input, Output> {
  name: string;
  input: Input;
  expectedOutput?: Output;
  validator: (output: Output, expected?: Output) => boolean;
  metadata?: Record<string, any>;
}

/**
 * Evaluation runner for agent/service testing
 */
export class EvaluationRunner<Input, Output> {
  private results: EvaluationResult[] = [];
  private startTime: number = 0;

  constructor(
    private serviceFunction: (input: Input) => Promise<Output>,
    private serviceName: string
  ) {}

  /**
   * Run a single test case
   */
  async runTest(testCase: TestCase<Input, Output>): Promise<EvaluationResult> {
    const startTime = performance.now();
    
    try {
      const output = await this.serviceFunction(testCase.input);
      const passed = testCase.validator(output, testCase.expectedOutput);
      const duration = performance.now() - startTime;

      const result: EvaluationResult = {
        testName: testCase.name,
        passed,
        duration,
        details: {
          input: testCase.input,
          output,
          expected: testCase.expectedOutput,
          metadata: testCase.metadata,
        },
      };

      this.results.push(result);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      const result: EvaluationResult = {
        testName: testCase.name,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
        details: {
          input: testCase.input,
          expected: testCase.expectedOutput,
          metadata: testCase.metadata,
        },
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * Run multiple test cases
   */
  async runTests(testCases: TestCase<Input, Output>[]): Promise<EvaluationResult[]> {
    this.startTime = performance.now();
    this.results = [];

    for (const testCase of testCases) {
      await this.runTest(testCase);
    }

    return this.results;
  }

  /**
   * Run tests in parallel
   */
  async runTestsParallel(testCases: TestCase<Input, Output>[]): Promise<EvaluationResult[]> {
    this.startTime = performance.now();
    this.results = [];

    const results = await Promise.all(
      testCases.map(testCase => this.runTest(testCase))
    );

    return results;
  }

  /**
   * Get summary of evaluation results
   */
  getSummary() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const avgDuration = totalTests > 0 
      ? this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests 
      : 0;
    const totalDuration = performance.now() - this.startTime;

    return {
      serviceName: this.serviceName,
      totalTests,
      passedTests,
      failedTests,
      successRate: parseFloat(successRate.toFixed(2)),
      avgDuration: parseFloat(avgDuration.toFixed(2)),
      totalDuration: parseFloat(totalDuration.toFixed(2)),
      results: this.results,
    };
  }

  /**
   * Get detailed metrics
   */
  getMetrics(): EvaluationMetrics {
    const summary = this.getSummary();
    
    return {
      accuracy: summary.successRate / 100,
      latency: summary.avgDuration,
      throughput: summary.totalTests / (summary.totalDuration / 1000), // tests per second
      errorRate: (summary.failedTests / summary.totalTests) || 0,
    };
  }

  /**
   * Export results to JSON
   */
  exportResults() {
    return {
      summary: this.getSummary(),
      metrics: this.getMetrics(),
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Assertion utilities for validation
 */
export const assertions = {
  /**
   * Check if value is defined
   */
  isDefined: <T>(value: T): value is NonNullable<T> => {
    return value !== null && value !== undefined;
  },

  /**
   * Check if string matches pattern
   */
  matchesPattern: (value: string, pattern: RegExp): boolean => {
    return pattern.test(value);
  },

  /**
   * Check if array has expected length
   */
  hasLength: <T>(array: T[], min: number, max?: number): boolean => {
    if (max !== undefined) {
      return array.length >= min && array.length <= max;
    }
    return array.length >= min;
  },

  /**
   * Check if value is within range
   */
  inRange: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  },

  /**
   * Check if object has required properties
   */
  hasProperties: <T extends object>(obj: T, properties: (keyof T)[]): boolean => {
    return properties.every(prop => prop in obj);
  },

  /**
   * Deep equality check
   * Note: This is a simple implementation. For complex objects with circular references
   * or different property ordering, consider using a library like lodash.isEqual
   */
  deepEqual: (a: any, b: any): boolean => {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!assertions.deepEqual(a[key], b[key])) return false;
    }
    
    return true;
  },

  /**
   * Check if value meets threshold
   */
  meetsThreshold: (value: number, threshold: number, operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq'): boolean => {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      default: return false;
    }
  },
};

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();

  /**
   * Start measuring performance
   */
  start(label: string): () => number {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      
      if (!this.measurements.has(label)) {
        this.measurements.set(label, []);
      }
      this.measurements.get(label)!.push(duration);
      
      return duration;
    };
  }

  /**
   * Get statistics for a label
   */
  getStats(label: string) {
    const measurements = this.measurements.get(label) || [];
    
    if (measurements.length === 0) {
      return null;
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const sum = measurements.reduce((a, b) => a + b, 0);
    const mean = sum / measurements.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      count: measurements.length,
      mean: parseFloat(mean.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      p95: parseFloat(p95.toFixed(2)),
      p99: parseFloat(p99.toFixed(2)),
    };
  }

  /**
   * Get all statistics
   */
  getAllStats() {
    const stats: Record<string, any> = {};
    
    for (const [label, _] of this.measurements) {
      stats[label] = this.getStats(label);
    }
    
    return stats;
  }

  /**
   * Clear measurements
   */
  clear(label?: string) {
    if (label) {
      this.measurements.delete(label);
    } else {
      this.measurements.clear();
    }
  }
}
