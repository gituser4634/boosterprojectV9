/**
 * Retry logic for database operations when connection pool is exhausted
 * Implements exponential backoff to handle EMAXCONNSESSION errors gracefully
 */

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 100
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Check if it's a connection pool error
      const isPoolError = 
        error?.message?.includes("EMAXCONNSESSION") ||
        error?.message?.includes("max clients reached") ||
        error?.originalCode === "XX000";

      if (!isPoolError || attempt === maxRetries - 1) {
        // Not a pool error, or last attempt - throw immediately
        throw error;
      }

      // Exponential backoff: 100ms, 200ms, 400ms
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error("Database operation failed");
}
