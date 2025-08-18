import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { storage } from './storage';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET || 'showpls-secret-key-2024';
console.log('[TELEGRAM] JWT Secret initialized');

if (!TELEGRAM_BOT_TOKEN) {
  console.warn('TELEGRAM_BOT_TOKEN not set - Telegram functionality will be disabled');
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramWebAppInitData {
  user?: TelegramUser;
  chat_instance?: string;
  chat_type?: string;
  auth_date: number;
  hash: string;
  [key: string]: any;
}

// Verify Telegram Web App data
export function verifyTelegramWebAppData(initData: string): TelegramWebAppInitData | null {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[TELEGRAM] Bot token not available');
    return null;
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
      console.warn('[TELEGRAM] No hash provided');
      return null;
    }

    // Remove hash from params for verification
    urlParams.delete('hash');
    
    // Sort parameters alphabetically
    const sortedParams = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create secret key from bot token
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(TELEGRAM_BOT_TOKEN)
      .digest();

    // Generate expected hash
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(sortedParams)
      .digest('hex');

    if (hash !== expectedHash) {
      console.warn('[TELEGRAM] Hash verification failed');
      return null;
    }

    // Check if data is not too old (within 24 hours)
    const authDate = parseInt(urlParams.get('auth_date') || '0');
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (currentTime - authDate > 86400) { // 24 hours
      console.warn('[TELEGRAM] Data too old');
      return null;
    }

    // Parse user data
    const userData = urlParams.get('user');
    let user: TelegramUser | undefined;
    
    if (userData) {
      try {
        user = JSON.parse(userData);
      } catch (error) {
        console.warn('[TELEGRAM] Failed to parse user data');
        return null;
      }
    }

    console.log('[TELEGRAM] Successfully verified WebApp data for user:', user?.username || user?.id);

    return {
      user,
      chat_instance: urlParams.get('chat_instance') || undefined,
      chat_type: urlParams.get('chat_type') || undefined,
      auth_date: authDate,
      hash
    };
  } catch (error) {
    console.error('[TELEGRAM] Verification error:', error);
    return null;
  }
}

// Generate JWT token from Telegram user data
export async function generateUserToken(telegramUser: TelegramUser): Promise<{ token: string; user: any }> {
  try {
    // Check if user exists, create if not
    let user = await storage.getUserByTelegramId(telegramUser.id.toString());
    
    if (!user) {
      console.log('[TELEGRAM] Creating new user for Telegram ID:', telegramUser.id);
      
      // Create new user
      const newUser = await storage.createUser({
        telegramId: telegramUser.id.toString(),
        username: telegramUser.username || `user_${telegramUser.id}`,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        languageCode: telegramUser.language_code || 'en',
        isPremium: telegramUser.is_premium || false,
        photoUrl: telegramUser.photo_url,
        isProvider: false,
        isActive: true
      });
      
      user = newUser;
    } else {
      // Update existing user with latest Telegram data
      console.log('[TELEGRAM] Updating existing user:', user.username);
      
      // Here you could update user info if needed
      // await storage.updateUser(user.id, { ... });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: user.id,
        telegramId: user.telegramId,
        username: user.username,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      JWT_SECRET
    );

    console.log('[TELEGRAM] Generated token for user:', user.username);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        telegramId: user.telegramId,
        isProvider: user.isProvider,
        rating: user.rating,
        photoUrl: user.photoUrl
      }
    };
  } catch (error) {
    console.error('[TELEGRAM] Error generating user token:', error);
    throw new Error('Failed to generate user token');
  }
}

// Send message via Telegram Bot API
export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[TELEGRAM] Cannot send message - bot token not available');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();
    
    if (!result.ok) {
      console.error('[TELEGRAM] Failed to send message:', result);
      return false;
    }

    console.log('[TELEGRAM] Message sent successfully to chat:', chatId);
    return true;
  } catch (error) {
    console.error('[TELEGRAM] Error sending message:', error);
    return false;
  }
}

// Set webhook for Telegram bot
export async function setTelegramWebhook(webhookUrl: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[TELEGRAM] Cannot set webhook - bot token not available');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query', 'inline_query'],
        secret_token: process.env.TELEGRAM_WEBHOOK_SECRET || 'showpls-webhook-secret-2025'
      })
    });

    const result = await response.json();
    
    if (!result.ok) {
      console.error('[TELEGRAM] Failed to set webhook:', result);
      return false;
    }

    console.log('[TELEGRAM] Webhook set successfully:', webhookUrl);
    return true;
  } catch (error) {
    console.error('[TELEGRAM] Error setting webhook:', error);
    return false;
  }
}

// Get bot info
export async function getBotInfo(): Promise<any> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[TELEGRAM] Cannot get bot info - bot token not available');
    return null;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
    const result = await response.json();
    
    if (!result.ok) {
      console.error('[TELEGRAM] Failed to get bot info:', result);
      return null;
    }

    console.log('[TELEGRAM] Bot info:', result.result);
    return result.result;
  } catch (error) {
    console.error('[TELEGRAM] Error getting bot info:', error);
    return null;
  }
}

// Set up Telegram Web App
export async function setupTelegramWebApp(webAppUrl: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[TELEGRAM] Cannot set up Web App - bot token not available');
    return false;
  }

  try {
    // Set the Web App URL using setChatMenuButton
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setChatMenuButton`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        menu_button: {
          type: 'web_app',
          text: 'Open Showpls',
          web_app: {
            url: webAppUrl
          }
        }
      })
    });

    const result = await response.json();
    
    if (!result.ok) {
      console.error('[TELEGRAM] Failed to set up Web App:', result);
      return false;
    }

    console.log('[TELEGRAM] Web App set up successfully:', webAppUrl);
    return true;
  } catch (error) {
    console.error('[TELEGRAM] Error setting up Web App:', error);
    return false;
  }
}