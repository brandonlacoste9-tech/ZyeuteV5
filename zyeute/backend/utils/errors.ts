/**
 * Custom Error Classes for Zyeuté Backend
 * Replaces generic Error with typed, contextual errors
 */

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public cause?: Error,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.context && { context: this.context }),
      ...(this.cause && { cause: this.cause.message }),
    };
  }
}

// Colony OS Specific Errors
export class BeeRegistryError extends AppError {
  constructor(message: string, cause?: Error, context?: Record<string, any>) {
    super("ERR_BEE_REGISTRY_FAIL", message, 500, cause, context);
  }
}

export class SynapseConnectionError extends AppError {
  constructor(message: string, cause?: Error, context?: Record<string, any>) {
    super("ERR_SYNAPSE_CONNECTION_LOST", message, 503, cause, context);
  }
}

export class HiveManagerError extends AppError {
  constructor(message: string, cause?: Error, context?: Record<string, any>) {
    super("ERR_HIVE_MANAGER_FAIL", message, 500, cause, context);
  }
}

// Automation Bridge Errors
export class AutomationBridgeError extends AppError {
  constructor(message: string, cause?: Error, context?: Record<string, any>) {
    super("ERR_AUTOMATION_BRIDGE_FAIL", message, 503, cause, context);
  }
}

export class AutomationTimeoutError extends AppError {
  constructor(message: string, timeout: number, context?: Record<string, any>) {
    super(
      "ERR_AUTOMATION_TIMEOUT",
      message || `Automation task timed out after ${timeout}ms`,
      504,
      undefined,
      { timeout, ...context }
    );
  }
}

// AI Service Errors
export class AIServiceError extends AppError {
  constructor(
    message: string,
    service: string,
    cause?: Error,
    context?: Record<string, any>
  ) {
    super(
      "ERR_AI_SERVICE_FAIL",
      message,
      503,
      cause,
      { service, ...context }
    );
  }
}

export class CircuitBreakerOpenError extends AppError {
  constructor(model: string, context?: Record<string, any>) {
    super(
      "ERR_CIRCUIT_BREAKER_OPEN",
      `Circuit breaker is open for model: ${model}. Falling back to alternative.`,
      503,
      undefined,
      { model, ...context }
    );
  }
}

// Database Errors
export class DatabaseError extends AppError {
  constructor(message: string, cause?: Error, context?: Record<string, any>) {
    super("ERR_DATABASE_FAIL", message, 500, cause, context);
  }
}

export class TransactionError extends AppError {
  constructor(message: string, cause?: Error, context?: Record<string, any>) {
    super("ERR_TRANSACTION_FAIL", message, 500, cause, context);
  }
}

// Validation Errors
export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string[]>) {
    super(
      "ERR_VALIDATION_FAIL",
      message,
      400,
      undefined,
      fields && { fields }
    );
  }
}

// Authentication & Authorization Errors
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required", context?: Record<string, any>) {
    super("ERR_AUTHENTICATION_REQUIRED", message, 401, undefined, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions", context?: Record<string, any>) {
    super("ERR_AUTHORIZATION_FAIL", message, 403, undefined, context);
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Helper to convert any error to AppError for consistent error handling
 */
export function toAppError(error: unknown, defaultCode: string = "ERR_UNKNOWN"): AppError {
  if (isAppError(error)) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError(defaultCode, error.message, 500, error);
  }
  
  return new AppError(
    defaultCode,
    String(error),
    500,
    undefined,
    { originalError: error }
  );
}
