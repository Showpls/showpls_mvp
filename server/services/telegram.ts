import crypto from 'crypto';
import { storage } from '../storage';

interface TelegramUser {
  id: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: TelegramUser;
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    date: number;
  };
  callback_query?: {
    id: string;
    from: TelegramUser;
    message: any;
    data: string;
  };
}

class TelegramService {
  private botToken: string;
  private webhookSecret: string;
  private botUsername: string;
  private baseUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || '';
    this.botUsername = process.env.TELEGRAM_BOT_USERNAME || 'showpls_bot';
    this.baseUrl = process.env.APP_BASE_URL || 'https://app.showpls.com';

    if (!this.botToken) {
      console.warn('TELEGRAM_BOT_TOKEN not set - Telegram functionality will be disabled');
    }
  }

  // Verify Telegram login data using HMAC
  verifyTelegramAuth(data: any): boolean {
    if (!this.botToken) return false;

    try {
      const { hash, ...userData } = data;
      
      // Create data-check-string
      const dataCheckString = Object.keys(userData)
        .sort()
        .map(key => `${key}=${userData[key]}`)
        .join('\n');

      // Create secret key
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(this.botToken).digest();
      
      // Calculate hash
      const calculatedHash = crypto.createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      return calculatedHash === hash;
    } catch (error) {
      console.error('Error verifying Telegram auth:', error);
      return false;
    }
  }

  // Handle webhook updates from Telegram
  async handleWebhook(update: TelegramUpdate): Promise<void> {
    try {
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
    }
  }

  private async handleMessage(message: any): Promise<void> {
    const { from, text, chat } = message;
    const userId = from.id.toString();

    // Get or create user
    let user = await storage.getUserByTelegramId(userId);
    if (!user) {
      user = await storage.createUser({
        telegramId: userId,
        username: from.username || `user_${userId}`,
        firstName: from.first_name,
        lastName: from.last_name,
        languageCode: from.language_code || 'en',
      });
    }

    // Handle commands
    if (text?.startsWith('/')) {
      await this.handleCommand(text, user, chat.id);
    }
  }

  private async handleCommand(command: string, user: any, chatId: number): Promise<void> {
    const [cmd] = command.split(' ');

    switch (cmd) {
      case '/start':
        await this.sendWelcomeMessage(chatId, user);
        break;
      case '/new':
        await this.sendNewRequestPrompt(chatId);
        break;
      case '/orders':
        await this.sendUserOrders(chatId, user.id);
        break;
      case '/help':
        await this.sendHelpMessage(chatId);
        break;
      default:
        await this.sendMessage(chatId, 'Unknown command. Use /help to see available commands.');
    }
  }

  private async handleCallbackQuery(callbackQuery: any): Promise<void> {
    const { id, from, data } = callbackQuery;

    try {
      if (data === 'open_app') {
        // Answer callback query
        await this.answerCallbackQuery(id, 'Opening Showpls...');
      }
    } catch (error) {
      console.error('Error handling callback query:', error);
    }
  }

  private async sendWelcomeMessage(chatId: number, user: any): Promise<void> {
    const message = `Welcome to Showpls, ${user.firstName || user.username}!

Your Eyes, Everywhere. Reality in real-time.

Get live photos, videos, and streams from any location worldwide with secure TON blockchain payments.

Tap the button below to open the app:`;

    const keyboard = {
      inline_keyboard: [[
        {
          text: 'Open Showpls',
          web_app: { url: `${this.baseUrl}/twa` }
        }
      ]]
    };

    await this.sendMessage(chatId, message, keyboard);
  }

  private async sendNewRequestPrompt(chatId: number): Promise<void> {
    const message = `Create a new request in the Showpls app to get real-time content from anywhere in the world!`;

    const keyboard = {
      inline_keyboard: [[
        {
          text: '➕ Create Request',
          web_app: { url: `${this.baseUrl}/twa` }
        }
      ]]
    };

    await this.sendMessage(chatId, message, keyboard);
  }

  private async sendUserOrders(chatId: number, userId: string): Promise<void> {
    try {
      const requestedOrders = await (storage as any).getUserOrders(userId);
      const providedOrders: any[] = [];

      let message = 'Your Orders:\n\n';

      if (requestedOrders.length === 0 && providedOrders.length === 0) {
        message += 'No orders found. Create your first request!';
      } else {
        if (requestedOrders.length > 0) {
          message += 'Requested:\n';
          requestedOrders.slice(0, 5).forEach((order: any, index: number) => {
            const ton = (Number(order.budgetNanoTon) / 1e9).toFixed(2);
            message += `${index + 1}. ${order.title} - ${order.status} (${ton} TON)\n`;
          });
          message += '\n';
        }

        if (providedOrders.length > 0) {
          message += 'Provided:\n';
          providedOrders.slice(0, 5).forEach((order: any, index: number) => {
            const ton = (Number(order.budgetNanoTon) / 1e9).toFixed(2);
            message += `${index + 1}. ${order.title} - ${order.status} (${ton} TON)\n`;
          });
        }
      }

      const keyboard = {
        inline_keyboard: [[
          {
            text: 'Open App',
            web_app: { url: `${this.baseUrl}/twa` }
          }
        ]]
      };

      await this.sendMessage(chatId, message, keyboard);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      await this.sendMessage(chatId, 'Error fetching your orders. Please try again later.');
    }
  }

  private async sendHelpMessage(chatId: number): Promise<void> {
    const message = `Showpls Help

Available commands:
/start - Welcome message and app access
/new - Create a new request
/orders - View your orders
/help - Show this help message

About Showpls:
- Get real-time visual content from anywhere
- Secure payments with TON blockchain
- Connect with local providers worldwide
- Available 24/7 in 50+ countries

How it works:
1. Create a request with location and budget
2. Local providers accept and complete your task
3. Review and approve content for secure payment

Need more help? Contact support in the app.`;

    const keyboard = {
      inline_keyboard: [[
        {
          text: 'Open Showpls',
          web_app: { url: `${this.baseUrl}/twa` }
        }
      ]]
    };

    await this.sendMessage(chatId, message, keyboard);
  }

  // Send a message to a chat
  async sendMessage(chatId: number, text: string, replyMarkup?: any): Promise<void> {
    if (!this.botToken) return;

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const payload: any = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      };

      if (replyMarkup) {
        payload.reply_markup = replyMarkup;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending Telegram message:', error);
    }
  }

  // Send notification to user
  async sendNotification(userId: string, title: string, message: string, orderId?: string): Promise<void> {
    try {
      const user = await storage.getUser(userId);
      if (!user?.telegramId) return;

      const chatId = parseInt(user.telegramId);
      let text = `🔔 ${title}\n\n${message}`;

      const keyboard: any = {
        inline_keyboard: [[
          {
            text: '📱 Open App',
            web_app: { url: `${this.baseUrl}/twa` }
          }
        ]]
      };

      if (orderId) {
        keyboard.inline_keyboard[0].unshift({
          text: '💬 Open Chat',
          web_app: { url: `${this.baseUrl}/chat/${orderId}` }
        });
      }

      await this.sendMessage(chatId, text, keyboard);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Answer callback query
  private async answerCallbackQuery(queryId: string, text?: string): Promise<void> {
    if (!this.botToken) return;

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`;
      const payload = {
        callback_query_id: queryId,
        text: text || '',
      };

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Error answering callback query:', error);
    }
  }

  // Set webhook URL
  async setWebhook(url: string): Promise<boolean> {
    if (!this.botToken) return false;

    try {
      const webhookUrl = `https://api.telegram.org/bot${this.botToken}/setWebhook`;
      const payload = {
        url: url,
        secret_token: this.webhookSecret,
        allowed_updates: ['message', 'callback_query'],
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('Webhook set result:', result);
      return result.ok;
    } catch (error) {
      console.error('Error setting webhook:', error);
      return false;
    }
  }

  // Get bot info
  async getBotInfo(): Promise<any> {
    if (!this.botToken) return null;

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/getMe`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Error getting bot info:', error);
      return null;
    }
  }
}

export const telegramService = new TelegramService();
