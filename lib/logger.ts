type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  stack?: string;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * Structured logging utility for consistent log formatting.
 * In production, these logs can be parsed by log aggregation tools.
 */

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * Log an error with context and optional metadata.
 * Use for caught exceptions and error conditions.
 */
export function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  const entry: LogEntry = {
    level: "error",
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  console.error(formatLog(entry));
}

/**
 * Log a warning with context and optional metadata.
 * Use for recoverable issues or potential problems.
 */
export function logWarn(
  context: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  const entry: LogEntry = {
    level: "warn",
    context,
    message,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  console.warn(formatLog(entry));
}

/**
 * Log info with context and optional metadata.
 * Use for significant application events.
 */
export function logInfo(
  context: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  const entry: LogEntry = {
    level: "info",
    context,
    message,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  console.info(formatLog(entry));
}

/**
 * Log debug information with context and optional metadata.
 * Only logs in development environment.
 */
export function logDebug(
  context: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === "production") return;

  const entry: LogEntry = {
    level: "debug",
    context,
    message,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  console.debug(formatLog(entry));
}

/**
 * Create a logger instance scoped to a specific context.
 * Useful for modules that make many log calls.
 */
export function createLogger(context: string) {
  return {
    error: (error: unknown, metadata?: Record<string, unknown>) =>
      logError(context, error, metadata),
    warn: (message: string, metadata?: Record<string, unknown>) =>
      logWarn(context, message, metadata),
    info: (message: string, metadata?: Record<string, unknown>) =>
      logInfo(context, message, metadata),
    debug: (message: string, metadata?: Record<string, unknown>) =>
      logDebug(context, message, metadata),
  };
}
