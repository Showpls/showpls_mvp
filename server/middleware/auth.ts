import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface TelegramInitData {
  query_id?: string;
  user?: string;
  auth_date: string;
  hash: string;
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export function validateTelegramAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Telegram ')) {
    return res.status(401).json({ error: 'Missing Telegram auth header' });
  }

  const initData = authHeader.replace('Telegram ', '');
  
  try {
    const parsed = parseInitData(initData);
    const isValid = validateInitData(parsed, initData);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid Telegram signature' });
    }

    // Check TTL (1 hour)
    const authTime = parseInt(parsed.auth_date);
    const now = Math.floor(Date.now() / 1000);
    if (now - authTime > 3600) {
      return res.status(401).json({ error: 'Auth data expired' });
    }

    // Parse user data
    const userData: TelegramUser = parsed.user ? JSON.parse(parsed.user) : null;
    if (!userData) {
      return res.status(401).json({ error: 'Missing user data' });
    }

    // Log for anti-fraud
    console.log('[AUTH]', {
      userId: userData.id,
      username: userData.username,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // Attach user-like payload to request (for downstream optional usage)
    (req as any).user = {
      id: userData.id.toString(),
      telegramId: userData.id.toString(),
      username: userData.username || '',
      firstName: userData.first_name || null,
      lastName: userData.last_name || null,
      languageCode: userData.language_code || null,
      walletAddress: null,
      isProvider: false,
    };

    next();
  } catch (error) {
    console.error('[AUTH ERROR]', error);
    return res.status(401).json({ error: 'Auth validation failed' });
  }
}

function parseInitData(initData: string): TelegramInitData {
  const params = new URLSearchParams(initData);
  return {
    query_id: params.get('query_id') || undefined,
    user: params.get('user') || undefined,
    auth_date: params.get('auth_date') || '',
    hash: params.get('hash') || ''
  };
}

function validateInitData(parsed: TelegramInitData, initData: string): boolean {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.warn('[AUTH] TELEGRAM_BOT_TOKEN not set - skipping validation in development');
    return true; // Allow in development
  }

  const { hash, ...dataToCheck } = parsed;
  
  // Create data check string
  const dataCheckString = Object.entries(dataToCheck)
    .filter(([_, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Generate secret key
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  // Generate hash
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return calculatedHash === hash;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: import("@shared/schema").User;
    }
  }
}