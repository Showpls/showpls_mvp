import { db } from '../db';
import { idempotentRequests } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function withIdempotency<T>(
  key: string | undefined,
  payload: { endpoint: string; userId: string; orderId?: string },
  handler: () => Promise<T>
): Promise<T> {
  if (!key) {
    console.warn('[IDEMPOTENCY] No key provided for critical operation:', payload.endpoint);
    return handler(); // Soft mode for development
  }

  try {
    // Check if this operation was already performed
    const [existing] = await db
      .select()
      .from(idempotentRequests)
      .where(eq(idempotentRequests.id, key))
      .limit(1);

    if (existing) {
      console.log('[IDEMPOTENCY] Returning cached response for key:', key);
      return existing.response as T;
    }

    // Execute the operation
    const result = await handler();

    // Store the result
    await db.insert(idempotentRequests).values({
      id: key,
      operation: payload.endpoint,
      response: result as any,
    });

    console.log('[IDEMPOTENCY] Stored new response for key:', key);
    return result;
  } catch (error) {
    console.error('[IDEMPOTENCY] Error in withIdempotency:', error);
    throw error;
  }
}

// Helper to generate idempotency keys on client side
export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}