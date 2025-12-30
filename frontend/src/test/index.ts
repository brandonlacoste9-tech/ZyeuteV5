/**
 * Evaluation Framework - Main Export
 *
 * Centralized exports for easy importing of evaluation, tracing, and testing utilities.
 */

// Re-export everything from evaluation
export {
  EvaluationRunner,
  PerformanceMonitor,
  assertions,
  type EvaluationResult,
  type EvaluationMetrics,
  type TestCase,
} from "./evaluation";

// Re-export everything from tracing
export {
  Tracer,
  globalTracer,
  trace,
  traceAsync,
  traceSync,
  TraceLogger,
  createLogger,
  type LogLevel,
  type TraceEvent,
  type TraceSpan,
} from "./tracing";

// Re-export testing utilities
export { render, renderWithProviders, mockSupabase } from "./utils";

// Re-export common testing library utilities
export { screen, waitFor, within, fireEvent } from "@testing-library/react";

export { userEvent } from "@testing-library/user-event";
