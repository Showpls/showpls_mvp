import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyTelegramWebAppData, generateUserToken } from '../telegram';
import { storage } from '../storage';
import { validateTelegramAuth as authenticateTelegramHeader } from './auth';

const JWT_SECRET = process.env.JWT_SECRET || 'showpls-secret-key-2024';

export interface AuthenticatedRequest extends Request {
  user?: import("@shared/schema").User;
}

// Middleware that accepts either Bearer JWT or Telegram initData header
export function authenticateEither(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    // Delegate to JWT auth
    authenticateTelegramUser(req, res, next);
    return;
  }
  if (authHeader.startsWith('Telegram ')) {
    // Delegate to Telegram header auth
    authenticateTelegramHeader(req as any, res, next);
    return;
  }
  res.status(401).json({ error: 'No authorization token provided' });
}

// Middleware to authenticate Telegram Web App users
export async function authenticateTelegramUser(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No authorization token provided' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      // Verify JWT token
      const payload = jwt.verify(token, JWT_SECRET) as {
        sub: string;
        telegramId: string;
        username: string;
      };
      
      // Attach minimal user info; downstream can load full user from DB if needed
      (req as any).user = {
        id: payload.sub,
        telegramId: payload.telegramId,
        username: payload.username,
        firstName: null,
        lastName: null,
        languageCode: null,
        walletAddress: null,
        isProvider: false,
        rating: "0",
        totalRatings: 0,
        totalOrders: 0,
        isPremium: false,
        photoUrl: null,
        isActive: true,
        portfolioLinks: [],
        providerRank: 'BASIC',
        totalTipsReceived: "0",
        location: null,
        onboardingCompleted: false,
        lastActiveAt: null,
        createdAt: null,
        updatedAt: null,
      } as import("@shared/schema").User;
      
      console.log('[AUTH] Authenticated user:', (req as any).user?.username);
      next();
    } catch (jwtError) {
      console.warn('[AUTH] Invalid JWT token');
      res.status(401).json({ error: 'Invalid authorization token' });
      return;
    }
  } catch (error) {
    console.error('[AUTH] Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
    return;
  }
}

// Middleware to process Telegram Web App init data and generate JWT
export async function processTelegramInitData(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { initData } = req.body;
    
    if (!initData) {
      res.status(400).json({ error: 'initData is required' });
      return;
    }

    console.log('[TELEGRAM_AUTH] Processing init data...');
    
    // Verify Telegram WebApp data
    const verifiedData = verifyTelegramWebAppData(initData);
    
    if (!verifiedData || !verifiedData.user) {
      console.warn('[TELEGRAM_AUTH] Failed to verify Telegram data');
      res.status(401).json({ error: 'Invalid Telegram data' });
      return;
    }

    console.log('[TELEGRAM_AUTH] Verified Telegram user:', verifiedData.user.username || verifiedData.user.id);

    // Generate JWT token and user data
    const { token, user } = await generateUserToken(verifiedData.user);
    
    res.json({
      success: true,
      token,
      user,
      message: 'Successfully authenticated with Telegram'
    });
  } catch (error) {
    console.error('[TELEGRAM_AUTH] Error processing init data:', error);
    res.status(500).json({ error: 'Failed to process Telegram authentication' });
  }
}