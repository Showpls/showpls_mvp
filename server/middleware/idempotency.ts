import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { idempotentRequests } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface IdempotentRequest extends Request {
  idempotencyKey: string;
}

/**
 * Middleware to ensure idempotent operations for critical endpoints
 * Requires Idempotency-Key header for POST/PUT/DELETE operations
 */
export function requireIdempotency(operation: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only require idempotency for state-changing operations
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers['idempotency-key'] as string;
    
    if (!idempotencyKey) {
      return res.status(400).json({ 
        error: 'Idempotency-Key header is required for this operation',
        hint: 'Include a unique UUID in the Idempotency-Key header'
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(idempotencyKey)) {
      return res.status(400).json({ 
        error: 'Invalid Idempotency-Key format. Must be a valid UUID.' 
      });
    }

    try {
      // Check if this operation was already performed
      const [existingRequest] = await db
        .select()
        .from(idempotentRequests)
        .where(eq(idempotentRequests.id, idempotencyKey))
        .limit(1);

      if (existingRequest) {
        // Return the cached response
        console.log(`[IDEMPOTENCY] Returning cached response for key: ${idempotencyKey}`);
        return res.status(200).json(existingRequest.response);
      }

      // Store the idempotency key for the request
      (req as IdempotentRequest).idempotencyKey = idempotencyKey;
      
      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = function(body: any) {
        // Only cache successful responses (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Store the response asynchronously
          db.insert(idempotentRequests)
            .values([{
              id: idempotencyKey,
              operation,
              response: body,
            }])
            .catch(error => {
              console.error(`[IDEMPOTENCY] Failed to store response for key ${idempotencyKey}:`, error);
            });
        }
        
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('[IDEMPOTENCY] Error checking idempotency:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Generate a new idempotency key (for client use)
 */
export function generateIdempotencyKey(): string {
  return uuidv4();
}

/**
 * Clean up old idempotent requests (run via cron)
 * Keep requests for 24 hours
 */
export async function cleanupOldIdempotentRequests() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  try {
    const result = await db
      .delete(idempotentRequests)
      .where(eq(idempotentRequests.createdAt, oneDayAgo));
    
    console.log(`[CLEANUP] Removed old idempotent requests`);
  } catch (error) {
    console.error('[CLEANUP] Failed to cleanup idempotent requests:', error);
  }
}