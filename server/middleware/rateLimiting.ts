import { Request, Response, NextFunction } from 'express';
import { LRUCache } from 'lru-cache';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

interface RequestInfo {
  count: number;
  resetTime: number;
}

// In-memory cache for rate limiting (consider Redis for production)
const rateLimitCache = new LRUCache<string, RequestInfo>({
  max: 10000,
  ttl: 1000 * 60 * 60, // 1 hour TTL
});

// Anti-fraud tracking
const antifraudCache = new LRUCache<string, {
  userIds: Set<string>;
  orderCount: number;
  totalBudget: number;
  firstOrderTime: number;
}>({
  max: 5000,
  ttl: 1000 * 60 * 60 * 24, // 24 hours
});

/**
 * Rate limiting middleware factory
 */
export function createRateLimit(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = getClientIdentifier(req);
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    const key = `${identifier}:${req.route?.path || req.path}`;
    const requestInfo = rateLimitCache.get(key);
    
    if (!requestInfo || requestInfo.resetTime <= now) {
      // First request or window expired
      rateLimitCache.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return next();
    }
    
    if (requestInfo.count >= config.maxRequests) {
      const retryAfter = Math.ceil((requestInfo.resetTime - now) / 1000);
      res.set({
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(requestInfo.resetTime).toISOString(),
      });
      
      return res.status(429).json({
        error: config.message || 'Too many requests',
        retryAfter,
      });
    }
    
    // Increment counter
    requestInfo.count++;
    rateLimitCache.set(key, requestInfo);
    
    res.set({
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, config.maxRequests - requestInfo.count).toString(),
      'X-RateLimit-Reset': new Date(requestInfo.resetTime).toISOString(),
    });
    
    next();
  };
}

/**
 * Anti-fraud middleware for new account restrictions
 */
export function antifraudProtection(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(); // Skip if no user (should be caught by auth middleware)
  }
  
  const clientId = getClientIdentifier(req);
  const userId = req.user.telegramId;
  const now = Date.now();
  
  // Get or create fraud tracking data
  let fraudData = antifraudCache.get(clientId);
  if (!fraudData) {
    fraudData = {
      userIds: new Set([userId]),
      orderCount: 0,
      totalBudget: 0,
      firstOrderTime: now,
    };
  } else {
    fraudData.userIds.add(userId);
  }
  
  // Check for self-dealing (same client trying to accept own order)
  if (req.path.includes('/accept') && fraudData.userIds.size > 1) {
    console.warn('[ANTIFRAUD] Potential self-dealing detected', {
      clientId,
      userIds: Array.from(fraudData.userIds),
      userId,
      path: req.path,
    });
    
    return res.status(403).json({
      error: 'Suspicious activity detected',
      code: 'POTENTIAL_SELF_DEALING',
    });
  }
  
  // New account restrictions (first 24 hours)
  const accountAge = now - fraudData.firstOrderTime;
  const isNewAccount = accountAge < 24 * 60 * 60 * 1000; // 24 hours
  
  if (isNewAccount && req.method === 'POST' && req.path.includes('/orders')) {
    const budgetTon = parseFloat(req.body?.budget || '0');
    
    // Limits for new accounts
    const maxOrdersPerDay = 5;
    const maxTotalBudgetPerDay = 10; // TON
    const maxSingleOrderBudget = 5; // TON
    
    if (fraudData.orderCount >= maxOrdersPerDay) {
      return res.status(429).json({
        error: 'New account daily order limit reached',
        code: 'NEW_ACCOUNT_ORDER_LIMIT',
        limit: maxOrdersPerDay,
      });
    }
    
    if (fraudData.totalBudget + budgetTon > maxTotalBudgetPerDay) {
      return res.status(429).json({
        error: 'New account daily budget limit reached',
        code: 'NEW_ACCOUNT_BUDGET_LIMIT',
        limit: maxTotalBudgetPerDay,
      });
    }
    
    if (budgetTon > maxSingleOrderBudget) {
      return res.status(400).json({
        error: 'Order budget exceeds new account limit',
        code: 'NEW_ACCOUNT_SINGLE_ORDER_LIMIT',
        limit: maxSingleOrderBudget,
      });
    }
    
    // Update tracking
    fraudData.orderCount++;
    fraudData.totalBudget += budgetTon;
  }
  
  antifraudCache.set(clientId, fraudData);
  next();
}

/**
 * WebSocket rate limiting for chat messages
 */
export function createWebSocketRateLimit(maxMessagesPerSecond: number = 5) {
  const wsRateCache = new LRUCache<string, number[]>({
    max: 1000,
    ttl: 1000 * 10, // 10 seconds
  });
  
  return (userId: string): boolean => {
    const now = Date.now();
    const windowStart = now - 1000; // 1 second window
    
    const timestamps = wsRateCache.get(userId) || [];
    const recentTimestamps = timestamps.filter(t => t > windowStart);
    
    if (recentTimestamps.length >= maxMessagesPerSecond) {
      return false; // Rate limit exceeded
    }
    
    recentTimestamps.push(now);
    wsRateCache.set(userId, recentTimestamps);
    return true;
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(req: Request): string {
  // Use user ID if available, otherwise fall back to IP + User-Agent
  if (req.user?.telegramId) {
    return `user:${req.user.telegramId}`;
  }
  
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  return `client:${ip}:${userAgent.slice(0, 50)}`;
}

// Predefined rate limit configurations
export const RateLimits = {
  // General API endpoints
  general: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this client',
  }),
  
  // Order creation (more restrictive)
  orderCreation: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many orders created in the last hour',
  }),
  
  // Chat messages
  chatMessages: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many chat messages',
  }),
  
  // Dispute creation (very restrictive)
  disputeCreation: createRateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 3,
    message: 'Too many disputes opened in the last 24 hours',
  }),
  
  // Critical operations (payments, approvals)
  criticalOperations: createRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 5,
    message: 'Too many critical operations',
  }),
};

// createWebSocketRateLimit is already exported above