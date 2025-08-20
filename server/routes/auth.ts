import type { Express } from "express";
import crypto from "crypto";
import { z } from "zod";
import type { Request, Response } from "express";
import { storage } from "../storage";
import { authenticateTelegramUser } from "../middleware/telegramAuth";
import { generateUserToken } from "../telegram";
import { tonService } from "../services/ton";

// Telegram WebApp data validation schema
const telegramInitDataSchema = z.object({
  user: z.string(),
  chat_instance: z.string().optional(),
  chat_type: z.string().optional(),
  start_param: z.string().optional(),
  auth_date: z.string(),
  hash: z.string(),
});

// Parse and validate Telegram WebApp init data
function parseTelegramInitData(initData: string) {
  const urlParams = new URLSearchParams(initData);
  const data: Record<string, string> = {};
  
  // Avoid for..of to satisfy TS downlevel iteration
  Array.from(urlParams.entries()).forEach(([key, value]) => {
    data[key] = value;
  });
  
  return telegramInitDataSchema.parse(data);
}

// Verify Telegram WebApp signature
function verifyTelegramWebAppData(initData: string, botToken: string): boolean {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    // Sort parameters and create check string
    const sortedParams = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Create secret key
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    
    // Calculate expected hash
    const expectedHash = crypto.createHmac('sha256', secretKey).update(sortedParams).digest('hex');
    
    return hash === expectedHash;
  } catch (error) {
    console.error('[AUTH] Error verifying Telegram data:', error);
    return false;
  }
}

export function setupAuthRoutes(app: Express) {
  // Telegram WebApp authentication
  app.post('/api/auth/telegram', async (req, res) => {
    try {
      const { initData } = req.body;
      
      if (!initData) {
        return res.status(400).json({ error: 'Missing initData' });
      }

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        return res.status(500).json({ error: 'Bot token not configured' });
      }

      // Verify signature
      if (!verifyTelegramWebAppData(initData, botToken)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Parse data
      const parsedData = parseTelegramInitData(initData);
      const tgUser = JSON.parse(parsedData.user);

      // Generate JWT token and upsert user
      const { token, user } = await generateUserToken({
        id: Number(tgUser.id),
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        username: tgUser.username,
        language_code: tgUser.language_code,
        is_premium: tgUser.is_premium,
        photo_url: tgUser.photo_url,
      });

      return res.json({ success: true, token, user });

    } catch (error) {
      console.error('[AUTH] Error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // Get current user info (JWT protected)
  app.get('/api/me', authenticateTelegramUser, async (req, res) => {
    try {
      const authUser = (req as any).user as { id: string } | undefined;
      if (!authUser?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUser(authUser.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        isProvider: user.isProvider,
        location: user.location,
        walletAddress: user.walletAddress,
        rating: user.rating,
        totalOrders: user.totalOrders,
        onboardingCompleted: user.onboardingCompleted,
      });
    } catch (error) {
      console.error('[AUTH] Error getting user:', error);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  });

  // Update user profile (JWT protected)
  app.put('/api/me', authenticateTelegramUser, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { id: string } | undefined;
      if (!authUser?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const body = req.body as {
        isProvider?: boolean;
        location?: { lat: number; lng: number; address?: string } | null;
        onboardingCompleted?: boolean;
      };

      const updates: any = {};
      if (typeof body.isProvider === 'boolean') updates.isProvider = body.isProvider;
      if (body.location === null) {
        updates.location = null;
      } else if (body.location && typeof body.location.lat === 'number' && typeof body.location.lng === 'number') {
        updates.location = { lat: body.location.lat, lng: body.location.lng, address: body.location.address };
      }
      if (typeof body.onboardingCompleted === 'boolean') updates.onboardingCompleted = body.onboardingCompleted;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const updated = await storage.updateUser(authUser.id, updates);
      return res.json({
        id: updated.id,
        isProvider: updated.isProvider,
        location: updated.location,
        onboardingCompleted: updated.onboardingCompleted,
      });
    } catch (error) {
      console.error('[AUTH] Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Update user wallet address (JWT protected)
  app.put('/api/me/wallet', authenticateTelegramUser, async (req, res) => {
    try {
      const authUser = (req as any).user as { id: string } | undefined;
      const { walletAddress } = req.body as { walletAddress?: string };

      if (!authUser?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address required' });
      }

      // Validate TON wallet address format server-side
      const isValid = await tonService.validateWalletAddress(walletAddress);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid TON wallet address' });
      }

      const updated = await storage.updateUser(authUser.id, {
        walletAddress,
        updatedAt: new Date(),
      } as any);

      return res.json({ success: true, walletAddress: updated.walletAddress });
    } catch (error) {
      console.error('[AUTH] Error updating wallet:', error);
      res.status(500).json({ error: 'Failed to update wallet' });
    }
  });

  // Dev-only: simple browser login without Telegram initData
  app.post('/api/auth/dev-login', async (req, res) => {
    try {
      const enable = process.env.ENABLE_DEV_AUTH === '1' || process.env.NODE_ENV !== 'production';
      if (!enable) {
        return res.status(403).json({ error: 'Dev auth disabled in production' });
      }

      const body = req.body as {
        telegramId?: number | string;
        username?: string;
        first_name?: string;
        last_name?: string;
        is_premium?: boolean;
        photo_url?: string;
      };

      const telegramId = Number(body.telegramId || Date.now());
      const username = body.username || `devuser_${telegramId}`;

      const { token, user } = await generateUserToken({
        id: telegramId,
        first_name: body.first_name || 'Dev',
        last_name: body.last_name || 'User',
        username,
        language_code: 'en',
        is_premium: !!body.is_premium,
        photo_url: body.photo_url,
      });

      return res.json({ success: true, token, user });
    } catch (error) {
      console.error('[AUTH] dev-login error:', error);
      res.status(500).json({ error: 'Failed to create dev token' });
    }
  });

  // Dev-only: generate a signed Telegram initData to emulate Telegram header auth
  app.post('/api/auth/dev-initdata', async (req, res) => {
    try {
      const enable = process.env.ENABLE_DEV_AUTH === '1' || process.env.NODE_ENV !== 'production';
      if (!enable) {
        return res.status(403).json({ error: 'Dev auth disabled in production' });
      }

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        return res.status(500).json({ error: 'Bot token not configured' });
      }

      const body = req.body as {
        telegramId?: number | string;
        username?: string;
        first_name?: string;
        last_name?: string;
        is_premium?: boolean;
        photo_url?: string;
        chat_instance?: string;
        chat_type?: string;
        start_param?: string;
      };

      const tgUser = {
        id: Number(body.telegramId || Date.now()),
        first_name: body.first_name || 'Dev',
        last_name: body.last_name || 'User',
        username: body.username || undefined,
        language_code: 'en',
        is_premium: !!body.is_premium,
        photo_url: body.photo_url,
      } as any;

      const auth_date = Math.floor(Date.now() / 1000).toString();
      const params = new URLSearchParams();
      params.set('user', JSON.stringify(tgUser));
      if (body.chat_instance) params.set('chat_instance', String(body.chat_instance));
      if (body.chat_type) params.set('chat_type', String(body.chat_type));
      if (body.start_param) params.set('start_param', String(body.start_param));
      params.set('auth_date', auth_date);

      const base = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');

      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
      const hash = crypto.createHmac('sha256', secretKey).update(base).digest('hex');
      params.set('hash', hash);

      const initData = params.toString();
      return res.json({ success: true, initData, hint: 'Use as Authorization: Telegram <initData>' });
    } catch (error) {
      console.error('[AUTH] dev-initdata error:', error);
      res.status(500).json({ error: 'Failed to generate initData' });
    }
  });
}