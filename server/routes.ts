import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import { storage } from "./storage";
import { processTelegramInitData, authenticateTelegramUser } from "./middleware/telegramAuth";
import { getBotInfo, sendTelegramMessage, setTelegramWebhook, setupTelegramWebApp } from "./telegram";
import { createWSServer } from "./ws";
import { setupOrderRoutes } from "./routes/orders";
import { setupAuthRoutes } from "./routes/auth";
import { setupEscrowRoutes } from "./routes/escrow";
import { setupDevRoutes } from "./routes/dev";
import chatRoutes from './routes/chat';

// Telegram webhook processor
async function processTelegramUpdate(update: any) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  
  try {
    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const messageText = update.message.text;
      
      console.log(`[TELEGRAM] Message from ${chatId}: ${messageText}`);
      
      // Simple echo bot for testing
      let responseText = "Showpls bot online";
      
      if (messageText === '/start') {
        responseText = `Welcome to Showpls!\n\nConnect with local providers to get real-time photos and videos from any location worldwide.\n\nOpen the Web App to start ordering.`;
      } else if (messageText.toLowerCase().includes('hello')) {
        responseText = `Hello! I'm Showpls bot. Use /start to begin or open our Web App to place orders.`;
      }
      
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: responseText,
          reply_markup: {
            inline_keyboard: [[
              {
                text: "Open Showpls App",
                web_app: { url: (process.env.WEBAPP_BASE_URL || process.env.WEBAPP_URL || 'https://app.showpls.io') + '/twa' }
              }
            ]]
          }
        })
      });
    }
  } catch (error) {
    console.error('[TELEGRAM] Error processing update:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Parse JSON bodies
  app.use(express.json({ limit: '10mb' }));

  // Demo page for MVP features  
  app.get('/demo', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'demo.html'));
  });

  // Setup auth routes
  setupAuthRoutes(app);
  
  // Setup order routes
  setupOrderRoutes(app);
  
  // Setup escrow routes
  setupEscrowRoutes(app);

  // Setup dev routes (development only)
  if (process.env.NODE_ENV === 'development') {
    setupDevRoutes(app);
  }

  // Telegram webhook endpoint
  app.post('/telegram/webhook', async (req, res) => {
    const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!SECRET) {
      console.error('[WEBHOOK] TELEGRAM_WEBHOOK_SECRET not set');
      return res.sendStatus(500);
    }

    const header = req.get('X-Telegram-Bot-Api-Secret-Token');
    if (!header || header !== SECRET) {
      console.warn('[WEBHOOK] Invalid secret token');
      return res.sendStatus(401);
    }

    // ВАЖНО: ответить 200 как можно быстрее
    res.sendStatus(200);

    const update = req.body;
    console.log('[WEBHOOK] Received update:', JSON.stringify(update, null, 2));
    
    // Обработку запускаем асинхронно (не блокируем ответ)
    processTelegramUpdate(update).catch(console.error);
  });

  // Bot info endpoint
  app.get('/api/telegram/bot-info', async (req, res) => {
    try {
      const botInfo = await getBotInfo();
      if (!botInfo) {
        return res.status(500).json({ error: 'Failed to get bot info' });
      }
      res.json({ success: true, bot: botInfo });
    } catch (error) {
      console.error('Bot info error:', error);
      res.status(500).json({ error: 'Failed to retrieve bot information' });
    }
  });

  // Admin: set up Telegram Web App (protected by ADMIN_API_SECRET)
  app.post('/api/admin/setup-webapp', async (req, res) => {
    try {
      const adminSecret = req.get('x-admin-secret');
      const expectedSecret = process.env.ADMIN_API_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET;
      
      console.log('[ADMIN] Setup WebApp request:', {
        hasAdminSecret: !!adminSecret,
        hasExpectedSecret: !!expectedSecret,
        adminSecret: adminSecret?.substring(0, 10) + '...',
        expectedSecret: expectedSecret?.substring(0, 10) + '...'
      });
      
      if (!adminSecret || adminSecret !== expectedSecret) {
        console.log('[ADMIN] Forbidden - secret mismatch');
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const base = process.env.WEBAPP_BASE_URL || process.env.WEBAPP_URL || '';
      const webAppUrl = base ? `${base.replace(/\/$/, '')}/twa` : undefined;
      
      console.log('[ADMIN] WebApp setup:', { base, webAppUrl });
      
      if (!webAppUrl) {
        return res.status(400).json({ error: 'WEBAPP_BASE_URL or WEBAPP_URL not configured' });
      }
      
      const ok = await setupTelegramWebApp(webAppUrl);
      if (!ok) {
        return res.status(500).json({ error: 'Failed to set up Web App' });
      }
      
      console.log('[ADMIN] WebApp setup successful:', webAppUrl);
      return res.json({ success: true, webAppUrl });
    } catch (e) {
      console.error('[ADMIN] setup-webapp error:', e);
      return res.status(500).json({ error: 'Failed to set up Web App' });
    }
  });

  // Simple status endpoint to check Web App configuration
  app.get('/api/status', async (req, res) => {
    try {
      const base = process.env.WEBAPP_BASE_URL || process.env.WEBAPP_URL || '';
      const webAppUrl = base ? `${base.replace(/\/$/, '')}/twa` : undefined;
      
      res.json({
        status: 'ok',
        webAppUrl,
        environment: {
          hasBotToken: !!process.env.TELEGRAM_BOT_TOKEN,
          hasWebAppUrl: !!webAppUrl,
          nodeEnv: process.env.NODE_ENV
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Status check failed' });
    }
  });



  // Admin: set Telegram webhook (protected by ADMIN_API_SECRET)
  app.post('/api/admin/set-webhook', async (req, res) => {
    try {
      const adminSecret = req.get('x-admin-secret');
      if (!adminSecret || adminSecret !== (process.env.ADMIN_API_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const providedUrl: string | undefined = req.body?.url;
      const base = process.env.WEBAPP_BASE_URL || process.env.WEBAPP_URL || '';
      const url = providedUrl || (base ? `${base.replace(/\/$/, '')}/telegram/webhook` : undefined);
      if (!url) return res.status(400).json({ error: 'url required' });
      const ok = await setTelegramWebhook(url);
      if (!ok) return res.status(500).json({ error: 'Failed to set webhook' });
      return res.json({ success: true, url });
    } catch (e) {
      console.error('[ADMIN] set-webhook error:', e);
      return res.status(500).json({ error: 'Failed to set webhook' });
    }
  });

  // Get user profile
  app.get('/api/users/me', authenticateTelegramUser, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
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
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  });

  // Get orders in area
  app.get('/api/orders/area', authenticateTelegramUser, async (req, res) => {
    try {
      const { north, south, east, west, mediaType } = req.query;
      
      if (!north || !south || !east || !west) {
        return res.status(400).json({ error: 'Missing bounds parameters' });
      }

      const bounds = {
        north: parseFloat(north as string),
        south: parseFloat(south as string),
        east: parseFloat(east as string),
        west: parseFloat(west as string)
      };

      // Implement simple bounds filtering via nearby search as a fallback
      const centerLat = (bounds.north + bounds.south) / 2;
      const centerLng = (bounds.east + bounds.west) / 2;
      const radiusKm = Math.max(
        haversineDistance(bounds.north, centerLng, bounds.south, centerLng),
        haversineDistance(centerLat, bounds.east, centerLat, bounds.west)
      );
      const orders = await storage.getNearbyOrders(centerLat, centerLng, radiusKm);
      res.json({ success: true, orders });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ error: 'Failed to get orders' });
    }
  });

  // Create new order
  app.post('/api/orders', authenticateTelegramUser, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const orderData = {
        ...req.body,
        requesterId: userId
      };

      const order = await storage.createOrder(orderData);
      res.json({ success: true, order });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // Get user's orders
  app.get('/api/orders/my/:type', authenticateTelegramUser, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const { type } = req.params;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (type !== 'requested' && type !== 'provided') {
        return res.status(400).json({ error: 'Invalid order type' });
      }

      const orders = await storage.getUserOrders(userId);
      res.json({ success: true, orders });
    } catch (error) {
      console.error('Get user orders error:', error);
      res.status(500).json({ error: 'Failed to get user orders' });
    }
  });

  // Simple get all orders (authenticated)
  app.get('/api/orders', authenticateTelegramUser, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const orders = await storage.getAllOrders();
      res.json({ success: true, orders });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ error: 'Failed to get orders' });
    }
  });

  // Use the dedicated chat router
  app.use('/api', chatRoutes);

  // Accept order (JWT protected) - MVP inline logic
  app.post('/api/orders/:orderId/accept', authenticateTelegramUser, async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!user.isProvider) return res.status(403).json({ error: 'Only providers can accept orders' });

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.requesterId === userId) return res.status(400).json({ error: 'Cannot accept your own order' });
      if (order.status !== 'CREATED' && order.status !== 'FUNDED') {
        return res.status(400).json({ error: 'Order cannot be accepted in current status' });
      }

      const updated = await storage.updateOrder(orderId, {
        // @ts-ignore Partial typing loosened in storage
        providerId: userId,
        status: 'IN_PROGRESS',
        acceptedAt: new Date(),
        updatedAt: new Date(),
      } as any);

      return res.json({ success: true, order: updated });
    } catch (error) {
      console.error('Accept order error:', error);
      res.status(500).json({ error: 'Failed to accept order' });
    }
  });

  // Test Telegram message sending
  app.post('/api/telegram/send-test', authenticateTelegramUser, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const user = await storage.getUser(userId);
      
      if (!user || !user.telegramId) {
        return res.status(400).json({ error: 'No Telegram ID found for user' });
      }

        const success = await sendTelegramMessage(
          user.telegramId,
          'Тестовое сообщение от Showpls. Ваш аккаунт успешно подключен к платформе.'
        );

      if (success) {
        res.json({ success: true, message: 'Test message sent successfully' });
      } else {
        res.status(500).json({ error: 'Failed to send test message' });
      }
    } catch (error) {
      console.error('Send test message error:', error);
      res.status(500).json({ error: 'Failed to send test message' });
    }
  });

  // Status endpoint
  app.get('/api/status', async (req, res) => {
    try {
      const botInfo = await getBotInfo();
      const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;
      
      res.json({
        status: 'operational',
        telegram: {
          configured: hasToken,
          bot_connected: !!botInfo,
          bot_info: botInfo
        },
        features: {
          telegram_auth: hasToken,
          websocket_chat: true,
          real_time_updates: true
        }
      });
    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({ error: 'Status check failed' });
    }
  });

  // Health endpoint
  app.get('/health', async (_req, res) => {
    try {
      const botInfo = await getBotInfo();
      const hasDb = !!process.env.DATABASE_URL;
      const hasTon = !!process.env.TON_API_KEY;
      res.status(200).json({
        status: 'ok',
        uptimeSec: Math.floor(process.uptime()),
        env: process.env.NODE_ENV,
        checks: {
          telegramConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
          telegramReachable: !!botInfo,
          databaseConfigured: hasDb,
          tonConfigured: hasTon,
        }
      });
    } catch (e) {
      res.status(500).json({ status: 'error' });
    }
  });

  // MVP Demo page - ALWAYS available
  app.get('/mvp-demo.html', (req, res) => {
    res.sendFile(path.resolve('./public/mvp-demo.html'));
  });

  // Serve demo HTML files (for development)
  if (process.env.NODE_ENV === 'development') {
    app.get('/simple-websocket-test.html', (req, res) => {
      res.sendFile(path.resolve('./simple-websocket-test.html'));
    });
    app.get('/complete-test-demo.html', (req, res) => {
      res.sendFile(path.resolve('./complete-test-demo.html'));
    });
    app.get('/websocket-test.html', (req, res) => {
      res.sendFile(path.resolve('./websocket-test.html'));
    });
    app.get('/telegram-webapp-test.html', (req, res) => {
      res.sendFile(path.resolve('./telegram-webapp-test.html'));
    });
    app.get('/local-demo.html', (req, res) => {
      res.sendFile(path.resolve('./local-demo.html'));
    });
    app.get('/FINAL_TEST_DEMO.html', (req, res) => {
      res.sendFile(path.resolve('./FINAL_TEST_DEMO.html'));
    });
  }

  // Serve static files from public directory FIRST
  app.use(express.static("public", {
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));

  // This should be last - catch-all for SPA routing
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    // Skip static files (they should be handled by express.static above)
    if (req.path.match(/\.(html|js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
      return next();
    }
    // For development, let Vite handle it
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    // For production, serve the SPA
    res.sendFile(path.resolve('./public/index.html'));
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  console.log('[ROUTES] Initializing WebSocket server...');
  const wsServer = createWSServer(httpServer);
  console.log('[ROUTES] WebSocket server initialized');

  return httpServer;
}

declare global {
  namespace Express {
    interface Request {
      user?: import("@shared/schema").User;
    }
  }
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}