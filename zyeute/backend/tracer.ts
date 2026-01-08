/**
 * OpenTelemetry Tracing Setup for Vercel
 *
 * This module provides comprehensive tracing capabilities including:
 * - HTTP request/response tracing
 * - Database operation tracing
 * - External API call tracing
 * - Custom spans for business logic
 * - Error tracking with context
 */

import { trace, context, SpanStatusCode, Span } from "@opentelemetry/api";
// import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";

// Initialize Vercel OpenTelemetry if available
let isTracingEnabled = false;
let initializationPromise: Promise<void> | null = null;

// Initialize tracing asynchronously
function initializeTracing() {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      // @vercel/otel automatically sets up tracing when deployed on Vercel
      // In development, tracing will be minimal or disabled
      if (process.env.VERCEL || process.env.ENABLE_OTEL === "true") {
        const { registerOTel } = await import("@vercel/otel");
        registerOTel({
          serviceName: "zyeute-v3",
        });

        // Register instrumentations for automatic tracing
        // registerInstrumentations({
        //   instrumentations: [
        //     new HttpInstrumentation({
        //       ignoreIncomingRequestHook: (request) => {
        //         const url = request.url || '';
        //         return url.includes('/health') || url.includes('/favicon.ico');
        //       },
        //     }),
        //     new ExpressInstrumentation(),
        //   ],
        // });

        isTracingEnabled = true;
        console.log("✅ OpenTelemetry tracing enabled");
      } else {
        console.log(
          "ℹ️  OpenTelemetry tracing disabled (not on Vercel, set ENABLE_OTEL=true to enable)",
        );
      }
    } catch (error) {
      console.error("⚠️  Failed to initialize OpenTelemetry:", error);
    }
  })();

  return initializationPromise;
}

// Start initialization immediately
initializeTracing();

// Get the tracer instance
const tracer = trace.getTracer("zyeute-v3", "1.0.0");

/**
 * Create a traced operation
 *
 * @example
 * await traced("database-query", { operation: "SELECT" }, async (span) => {
 *   const result = await db.query();
 *   span.setAttributes({ rowCount: result.length });
 *   return result;
 * });
 */
export async function traced<T>(
  name: string,
  attributes: Record<string, string | number | boolean> = {},
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  if (!isTracingEnabled) {
    // If tracing is disabled, just execute the function with a mock span
    const mockSpan = {
      recordException: () => {},
      setStatus: () => {},
      setAttributes: () => {},
      setAttribute: () => {},
      addEvent: () => {},
      end: () => {},
      spanContext: () => ({ traceId: "", spanId: "", traceFlags: 0 }),
    } as any;
    return fn(mockSpan);
  }

  return tracer.startActiveSpan(name, async (span) => {
    try {
      // Add custom attributes
      span.setAttributes(attributes);

      const result = await fn(span);

      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      // Record exception in span
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Trace a database operation
 */
export async function traceDatabase<T>(
  operation: string,
  table: string,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  return traced(
    `db.${operation}`,
    {
      "db.operation": operation,
      "db.table": table,
      "db.system": "postgresql",
    },
    fn,
  );
}

/**
 * Trace an external API call
 */
export async function traceExternalAPI<T>(
  service: string,
  endpoint: string,
  method: string,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  return traced(
    `external.${service}`,
    {
      "http.method": method,
      "http.url": endpoint,
      "service.name": service,
    },
    fn,
  );
}

/**
 * Trace a Supabase operation
 */
export async function traceSupabase<T>(
  operation: string,
  details: Record<string, any> = {},
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  return traced(
    `supabase.${operation}`,
    {
      "supabase.operation": operation,
      ...details,
    },
    fn,
  );
}

/**
 * Trace a Stripe operation
 */
export async function traceStripe<T>(
  operation: string,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  return traced(
    `stripe.${operation}`,
    {
      "stripe.operation": operation,
    },
    fn,
  );
}

/**
 * Add attributes to the current active span
 */
export function addSpanAttributes(
  attributes: Record<string, string | number | boolean>,
) {
  if (!isTracingEnabled) return;

  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}

/**
 * Record an exception in the current span
 */
export function recordException(
  error: Error,
  attributes?: Record<string, string | number | boolean>,
) {
  if (!isTracingEnabled) return;

  const span = trace.getActiveSpan();
  if (span) {
    span.recordException(error);
    if (attributes) {
      span.setAttributes(attributes);
    }
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  }
}

/**
 * Get the current trace context (useful for logging)
 */
export function getTraceContext(): { traceId?: string; spanId?: string } {
  if (!isTracingEnabled) return {};

  const span = trace.getActiveSpan();
  if (!span) return {};

  const spanContext = span.spanContext();
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  };
}

/**
 * Express middleware to add tracing metadata to requests
 */
export function tracingMiddleware() {
  return (req: any, res: any, next: any) => {
    const traceContext = getTraceContext();

    // Add trace context to request for logging
    req.traceContext = traceContext;

    // Add trace headers to response
    if (traceContext.traceId) {
      res.setHeader("X-Trace-Id", traceContext.traceId);
    }

    next();
  };
}

export { isTracingEnabled, tracer };
