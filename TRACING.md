<<<<<<< HEAD
# OpenTelemetry Tracing Guide

This application uses OpenTelemetry for distributed tracing, providing deep visibility into application behavior, performance, and errors.

## Overview

Tracing helps you:
- **Debug production issues** faster with complete request context
- **Monitor performance** across all services and external APIs
- **Track database queries** to identify slow operations
- **Identify bottlenecks** in external API calls (Stripe, Supabase, DeepSeek, FAL, Resend)
- **Correlate logs** across distributed systems using trace IDs
- **Better error reporting** with full stack traces and context

## How It Works

### Automatic Instrumentation

The tracing system automatically captures:
- ✅ HTTP requests/responses (Express routes)
- ✅ Request duration and status codes
- ✅ Error stack traces and exceptions
- ✅ Database operations (PostgreSQL with Drizzle)
- ✅ External API calls (Stripe, Supabase, DeepSeek, FAL, Resend)

### On Vercel (Production)

When deployed on Vercel:
1. Traces are automatically sent to Vercel's observability platform
2. No additional configuration needed
3. View traces in the Vercel Dashboard → Monitoring → Traces
4. Traces include full distributed context across Edge, Serverless, and Database

### In Development

In development, tracing is disabled by default to reduce overhead. To enable:

```bash
ENABLE_OTEL=true npm run dev
```

This will output trace information to the console for debugging.

## Architecture

### Core Components

#### `/server/tracer.ts`
The central tracing module that provides:

- `traced()` - Wrap any operation with tracing
- `traceDatabase()` - Trace database operations
- `traceExternalAPI()` - Trace external API calls
- `traceStripe()` - Trace Stripe operations
- `traceSupabase()` - Trace Supabase operations
- `tracingMiddleware()` - Express middleware for request context
- `getTraceContext()` - Get current trace ID for log correlation
- `recordException()` - Record errors with context

#### Instrumentation Locations

**Server Entry** (`/server/index.ts`):
- Tracing middleware captures all HTTP requests
- Logs include trace IDs for correlation
- Error handler records exceptions with full context

**Database** (`/server/storage.ts`):
- Key operations traced: `getUser`, `getUserByUsername`, `createUser`
- Spans include user IDs and query types
- Performance metrics for database operations

**External APIs**:
- **Stripe** (`/server/routes.ts`): Payment checkout sessions
- **Supabase** (`/server/supabase-auth.ts`): JWT verification and auth
- **DeepSeek** (`/server/v3-swarm.ts`): AI chat completions
- **FAL** (`/server/routes.ts`): Image/video generation
- **Resend** (`/server/resend-client.ts`): Email delivery

## Using Tracing in Code

### Example: Trace a Custom Operation

```typescript
import { traced } from "./tracer.js";

async function processUserData(userId: string) {
  return traced("process-user-data", { user_id: userId }, async (span) => {
    // Your logic here
    const result = await someOperation();
    
    // Add custom attributes
    span.setAttributes({
      result_count: result.length,
      processing_time_ms: Date.now() - startTime,
    });
    
    return result;
  });
}
```

### Example: Trace a Database Query

```typescript
import { traceDatabase } from "./tracer.js";

async function getUserPosts(userId: string) {
  return traceDatabase("SELECT", "posts", async (span) => {
    span.setAttributes({ user_id: userId });
    const posts = await db.select().from(posts).where(eq(posts.userId, userId));
    span.setAttributes({ post_count: posts.length });
    return posts;
  });
}
```

### Example: Trace an External API Call

```typescript
import { traceExternalAPI } from "./tracer.js";

async function fetchUserProfile(userId: string) {
  return traceExternalAPI("external-service", "/users/:id", "GET", async (span) => {
    span.setAttributes({ user_id: userId });
    
    const response = await fetch(`https://api.example.com/users/${userId}`);
    const data = await response.json();
    
    span.setAttributes({
      response_status: response.status,
      response_size: JSON.stringify(data).length,
    });
    
    return data;
  });
}
```

### Example: Add Attributes to Current Span

```typescript
import { addSpanAttributes } from "./tracer.js";

function processRequest(req: Request) {
  // Add custom attributes to the current active span
  addSpanAttributes({
    user_id: req.session?.userId,
    request_path: req.path,
    request_method: req.method,
  });
}
```

### Example: Record Exceptions

```typescript
import { recordException } from "./tracer.js";

try {
  await riskyOperation();
} catch (error) {
  recordException(error as Error, {
    operation: "risky-operation",
    user_id: userId,
  });
  throw error;
}
```

## Viewing Traces

### On Vercel

1. Go to your Vercel Dashboard
2. Select your project
3. Navigate to **Monitoring** → **Traces**
4. Filter by:
   - Time range
   - Status code
   - Duration
   - Path
   - Trace ID

### Trace Attributes

Each trace includes:

**HTTP Attributes**:
- `http.method` - Request method (GET, POST, etc.)
- `http.url` - Request URL
- `http.status_code` - Response status code
- `http.request_duration` - Duration in milliseconds

**Database Attributes**:
- `db.system` - Database type (postgresql)
- `db.operation` - Query type (SELECT, INSERT, UPDATE, DELETE)
- `db.table` - Table name
- `db.user_id` / `db.username` - Query parameters

**AI/External API Attributes**:
- `ai.model` - Model name (deepseek-chat, flux-schnell, etc.)
- `ai.prompt_length` - Input size
- `ai.response_length` - Output size
- `service.name` - External service name
- `email.to` / `email.subject` - Email metadata

**Error Attributes**:
- `error.type` - Error class name
- `error.message` - Error message
- `error.stack` - Full stack trace

## Trace ID Correlation

Logs automatically include trace IDs for correlation:

```
3:45:12 PM [express] [trace:a1b2c3d4] GET /api/feed 200 in 145ms
```

Use the trace ID to:
1. Search logs in your logging platform
2. Find related traces in Vercel Monitoring
3. Debug complex distributed requests

## Performance Considerations

- ✅ **Minimal overhead**: <1% performance impact
- ✅ **Async processing**: Traces sent asynchronously
- ✅ **Smart sampling**: Automatic sampling in high-traffic scenarios
- ✅ **No blocking**: Tracing never blocks requests

## Environment Variables

Add to your `.env` or Vercel environment variables:

```bash
# Enable tracing in non-Vercel environments (optional)
ENABLE_OTEL=true
```

On Vercel, tracing is automatically enabled with no configuration needed.

## Troubleshooting

### Tracing Not Working

1. **Check environment**: Verify you're on Vercel or have `ENABLE_OTEL=true` set
2. **Check logs**: Look for "✅ OpenTelemetry tracing enabled" on startup
3. **Check imports**: Ensure tracing functions are imported from `./tracer.js`

### Missing Traces

1. **Check time range**: Traces may take a few seconds to appear
2. **Check filters**: Remove any active filters in the dashboard
3. **Check sampling**: High-traffic routes may be sampled

### Performance Issues

If you suspect tracing is causing issues:
1. Traces are async and shouldn't block
2. Check Vercel metrics for actual performance impact
3. Temporarily disable with `ENABLE_OTEL=false` to verify

## Best Practices

### DO ✅

- Add meaningful attributes to spans
- Use trace IDs in error messages
- Wrap external API calls with tracing
- Add database operation tracing for slow queries
- Record exceptions with context

### DON'T ❌

- Add sensitive data (passwords, tokens) to spans
- Create too many spans (max 1000 per trace)
- Block on tracing operations
- Include large payloads in attributes
- Trace in tight loops (aggregate instead)

## Advanced Usage

### Custom Trace Context Propagation

```typescript
import { trace, context } from "@opentelemetry/api";

// Get current context
const currentContext = context.active();

// Create a new span in a specific context
const span = trace.getTracer("custom").startSpan("operation", {}, currentContext);

try {
  // Do work
} finally {
  span.end();
}
```

### Trace with Custom Sampling

```typescript
// High-traffic endpoints may need custom sampling
if (Math.random() < 0.1) { // Sample 10% of requests
  return traced("high-traffic-operation", {}, async (span) => {
    // Expensive operation
  });
}
```

## References

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Vercel Observability](https://vercel.com/docs/observability)
- [@vercel/otel Package](https://www.npmjs.com/package/@vercel/otel)
- [OpenTelemetry JavaScript](https://github.com/open-telemetry/opentelemetry-js)

## Support

For issues or questions:
1. Check Vercel Dashboard logs
2. Review trace data in Monitoring
3. Check server logs for tracing errors
4. Verify environment variables are set correctly
=======
# Tracing Setup for Zyeuté V3

This project uses OpenTelemetry for distributed tracing.

## How to Run with Tracing

1. **Start the AI Toolkit Trace Collector**
   - In VS Code, run the command: `AI: Open Tracing Viewer`
   - This will start the OTLP collector and open the trace viewer.
   - The default endpoint is `http://localhost:4318/v1/traces`.

2. **Install Dependencies**
   - All required OpenTelemetry packages are already listed in `package.json`.

3. **Run the Server**
   - Start your server as usual:
     ```bash
     npm run dev    # or npm start
     ```
   - Tracing will be automatically initialized from `server/index.ts`.

4. **View Traces**
   - Open the AI Toolkit trace viewer in VS Code to see live traces.

## How It Works
- Tracing is initialized in `tracing-setup.ts` and imported at the top of `server/index.ts`.
- All Express and HTTP calls are auto-instrumented.
- You can add custom spans using OpenTelemetry APIs if needed.

## Customization
- To change the service name, edit `tracing-setup.ts`.
- To export traces to a different endpoint, update the OTLP exporter URL in `tracing-setup.ts`.

---

For more info, see the [OpenTelemetry JS Docs](https://opentelemetry.io/docs/instrumentation/js/).
>>>>>>> 3aa8f15 (Rebrand BB to B (Bitcoin AI): logo, UI, API, personas, docs)
