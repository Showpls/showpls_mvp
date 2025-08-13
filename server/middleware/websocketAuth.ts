import { WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { orders } from '@shared/schema';
import { eq, or, and } from 'drizzle-orm';

interface WSUser {
  telegramId: string;
  username: string;
}

interface AuthenticatedWebSocket extends WebSocket {
  user?: WSUser;
  orderId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
const JWT_EXPIRY = '1h';

/**
 * Generate short-lived JWT for WebSocket authentication
 */
export function generateWSToken(user: WSUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Authenticate WebSocket connection
 */
export async function authenticateWebSocket(
  ws: AuthenticatedWebSocket, 
  token: string, 
  orderId: string
): Promise<boolean> {
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as WSUser;
    
    // Verify user has access to this order
    const [order] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, orderId),
          or(
            eq(orders.requesterId, decoded.telegramId),
            eq(orders.providerId, decoded.telegramId)
          )
        )
      )
      .limit(1);
    
    if (!order) {
      console.warn('[WS_AUTH] User does not have access to order', {
        userId: decoded.telegramId,
        orderId,
      });
      return false;
    }
    
    // Attach user and order to WebSocket
    ws.user = decoded;
    ws.orderId = orderId;
    
    console.log('[WS_AUTH] WebSocket authenticated', {
      userId: decoded.telegramId,
      orderId,
    });
    
    return true;
  } catch (error) {
    console.error('[WS_AUTH] WebSocket authentication failed:', error);
    return false;
  }
}

/**
 * WebSocket message handler with authentication and rate limiting
 */
export function createAuthenticatedWSHandler(
  onMessage: (ws: AuthenticatedWebSocket, data: any) => void,
  rateLimitCheck: (userId: string) => boolean
) {
  return (ws: AuthenticatedWebSocket, message: Buffer) => {
    try {
      if (!ws.user) {
        ws.close(1008, 'Not authenticated');
        return;
      }
      
      // Rate limiting
      if (!rateLimitCheck(ws.user.telegramId)) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Rate limit exceeded',
        }));
        return;
      }
      
      const data = JSON.parse(message.toString());
      
      // Validate message structure
      if (!data.type) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        }));
        return;
      }
      
      onMessage(ws, data);
    } catch (error) {
      console.error('[WS_HANDLER] Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
      }));
    }
  };
}

/**
 * Broadcast message to all authenticated users in an order
 */
export function broadcastToOrder(
  wss: any,
  orderId: string,
  message: any,
  excludeUserId?: string
) {
  wss.clients.forEach((client: AuthenticatedWebSocket) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.orderId === orderId &&
      client.user &&
      client.user.telegramId !== excludeUserId
    ) {
      client.send(JSON.stringify(message));
    }
  });
}

export type { AuthenticatedWebSocket, WSUser };