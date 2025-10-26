/**
 * Error Tracking Utilities
 *
 * Provides centralized error logging and tracking functionality
 * using Sentry and custom error handling.
 */

import * as Sentry from "@sentry/nextjs";

export interface ErrorContext {
  userId?: string;
  chainId?: number;
  operation?: string;
  amount?: string;
  recipientCount?: number;
  [key: string]: any;
}

export interface ErrorInfo {
  message: string;
  error?: Error;
  context?: ErrorContext;
  level?: "error" | "warning" | "info";
}

/**
 * Logs an error with context to Sentry
 */
export function logError(errorInfo: ErrorInfo): void {
  const { message, error, context, level = "error" } = errorInfo;

  // Add context to Sentry scope
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }

    if (error) {
      scope.setTag("errorType", error.constructor.name);
    }

    scope.setLevel(level);

    if (error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(message, level);
    }
  });
}

/**
 * Logs a transaction error
 */
export function logTransactionError(
  error: Error,
  context: {
    fromChain: string;
    toChain: string;
    amount: string;
    recipient?: string;
    operation: string;
  }
): void {
  logError({
    message: `Transaction failed: ${context.operation}`,
    error,
    context: {
      operation: context.operation,
      fromChain: context.fromChain,
      toChain: context.toChain,
      amount: context.amount,
      recipient: context.recipient,
    },
  });
}

/**
 * Logs a CSV parsing error
 */
export function logCSVError(
  error: Error,
  context: {
    fileName: string;
    fileSize: number;
    lineCount: number;
    operation: string;
  }
): void {
  logError({
    message: `CSV parsing failed: ${context.operation}`,
    error,
    context: {
      operation: context.operation,
      fileName: context.fileName,
      fileSize: context.fileSize,
      lineCount: context.lineCount,
    },
  });
}

/**
 * Logs a wallet connection error
 */
export function logWalletError(
  error: Error,
  context: {
    walletType?: string;
    chainId?: number;
    operation: string;
  }
): void {
  logError({
    message: `Wallet error: ${context.operation}`,
    error,
    context: {
      operation: context.operation,
      walletType: context.walletType,
      chainId: context.chainId,
    },
  });
}

/**
 * Logs a gas estimation error
 */
export function logGasEstimationError(
  error: Error,
  context: {
    chainId: number;
    operation: string;
    provider?: string;
  }
): void {
  logError({
    message: `Gas estimation failed: ${context.operation}`,
    error,
    context: {
      operation: context.operation,
      chainId: context.chainId,
      provider: context.provider,
    },
  });
}

/**
 * Logs a batch operation error
 */
export function logBatchError(
  error: Error,
  context: {
    batchSize: number;
    completedCount: number;
    failedCount: number;
    operation: string;
  }
): void {
  logError({
    message: `Batch operation failed: ${context.operation}`,
    error,
    context: {
      operation: context.operation,
      batchSize: context.batchSize,
      completedCount: context.completedCount,
      failedCount: context.failedCount,
    },
  });
}

/**
 * Logs a performance issue
 */
export function logPerformanceIssue(
  message: string,
  context: {
    operation: string;
    duration: number;
    threshold: number;
  }
): void {
  logError({
    message: `Performance issue: ${message}`,
    context: {
      operation: context.operation,
      duration: context.duration,
      threshold: context.threshold,
    },
    level: "warning",
  });
}

/**
 * Logs user action for analytics
 */
export function logUserAction(
  action: string,
  context: ErrorContext = {}
): void {
  logError({
    message: `User action: ${action}`,
    context: {
      action,
      ...context,
    },
    level: "info",
  });
}

/**
 * Logs a security event
 */
export function logSecurityEvent(
  message: string,
  context: {
    eventType: string;
    severity: "low" | "medium" | "high" | "critical";
    [key: string]: any;
  }
): void {
  logError({
    message: `Security event: ${message}`,
    context: {
      eventType: context.eventType,
      severity: context.severity,
      ...context,
    },
    level: "error",
  });
}

/**
 * Sets user context for Sentry
 */
export function setUserContext(
  userId: string,
  userInfo?: Record<string, any>
): void {
  Sentry.setUser({
    id: userId,
    ...userInfo,
  });
}

/**
 * Clears user context
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * Adds breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: "debug" | "info" | "warning" | "error" = "info",
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Captures a message without throwing an error
 */
export function captureMessage(
  message: string,
  level: "debug" | "info" | "warning" | "error" = "info"
): void {
  Sentry.captureMessage(message, level);
}

/**
 * Captures an exception
 */
export function captureException(error: Error, context?: ErrorContext): void {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}
