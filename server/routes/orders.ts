import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { nanoid } from "nanoid";
import { authenticateTelegramUser } from "../middleware/telegramAuth";

// Order creation schema
const createOrderSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  mediaType: z.enum(['photo', 'video', 'live']),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }),
  budgetNanoTon: z.string().regex(/^\d+$/), // nano-TON as string to preserve precision
  isSampleOrder: z.boolean().optional().default(false),
});

export function setupOrderRoutes(app: Express) {
  // Create new order (JWT protected)
  app.post('/api/orders', authenticateTelegramUser, async (req, res) => {
    try {
      const authUser = (req as any).user as { id: string } | undefined;
      if (!authUser?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Validate request body
      const orderData = createOrderSchema.parse(req.body);

      // Create order
      const order = await storage.createOrder({
        requesterId: authUser.id,
        title: orderData.title,
        description: orderData.description,
        mediaType: orderData.mediaType,
        location: orderData.location,
        budgetNanoTon: orderData.budgetNanoTon,
        isSampleOrder: orderData.isSampleOrder,
        status: 'CREATED',
        platformFeeBps: 250, // 2.5%
      } as any);

      console.log('[ORDERS] Created new order:', order.id, 'by user:', authUser.id);

      res.json({
        success: true,
        order: {
          id: order.id,
          title: order.title,
          description: order.description,
          mediaType: order.mediaType,
          location: order.location,
          budgetNanoTon: order.budgetNanoTon,
          status: order.status,
          isSampleOrder: order.isSampleOrder,
          createdAt: order.createdAt,
        }
      });

    } catch (error) {
      console.error('[ORDERS] Error creating order:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid order data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // Get user's orders (JWT protected)
  app.get('/api/orders/user', authenticateTelegramUser, async (req, res) => {
    try {
      const authUser = (req as any).user as { id: string } | undefined;
      if (!authUser?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const orders = await storage.getUserOrders(authUser.id);

      res.json({
        orders: orders.map(order => ({
          id: order.id,
          title: order.title,
          description: order.description,
          mediaType: order.mediaType,
          location: order.location,
          budgetNanoTon: order.budgetNanoTon,
          status: order.status,
          isSampleOrder: order.isSampleOrder,
          createdAt: order.createdAt,
          acceptedAt: order.acceptedAt,
          deliveredAt: order.deliveredAt,
        }))
      });

    } catch (error) {
      console.error('[ORDERS] Error getting user orders:', error);
      res.status(500).json({ error: 'Failed to get orders' });
    }
  });

  // Get nearby orders for providers (JWT protected)
  app.get('/api/orders/nearby', authenticateTelegramUser, async (req, res) => {
    try {
      const authUser = (req as any).user as { id: string } | undefined;
      if (!authUser?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get lat/lng from query params
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radius = parseFloat(req.query.radius as string) || 10; // km

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: 'Invalid coordinates' });
      }

      const orders = await storage.getNearbyOrders(lat, lng, radius);

      res.json({
        orders: orders.map(order => ({
          id: order.id,
          title: order.title,
          description: order.description,
          mediaType: order.mediaType,
          location: order.location,
          budgetNanoTon: order.budgetNanoTon,
          status: order.status,
          createdAt: order.createdAt,
          estimatedCompletionAt: order.estimatedCompletionAt,
        }))
      });

    } catch (error) {
      console.error('[ORDERS] Error getting nearby orders:', error);
      res.status(500).json({ error: 'Failed to get nearby orders' });
    }
  });

  // Accept order (for providers) - JWT protected
  app.post('/api/orders/:orderId/accept', authenticateTelegramUser, async (req, res) => {
    try {
      const authUser = (req as any).user as { id: string } | undefined;
      if (!authUser?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { orderId } = req.params;

      // Get user details
      const user = await storage.getUser(authUser.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user is a provider
      if (!user.isProvider) {
        return res.status(403).json({ error: 'Only providers can accept orders' });
      }

      // Get order details
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Check order status
      if (order.status !== 'CREATED') {
        return res.status(400).json({ error: 'Order cannot be accepted. Current status: ' + order.status });
      }

      // Check if user is trying to accept their own order
      if (order.requesterId === user.id) {
        return res.status(400).json({ error: 'Cannot accept your own order' });
      }

      // Check if order already has a provider
      if (order.providerId) {
        return res.status(400).json({ error: 'Order already has a provider' });
      }

      // Accept the order - set status to IN_PROGRESS and assign provider
      const updatedOrder = await storage.updateOrder(orderId, {
        status: 'IN_PROGRESS',
        providerId: user.id,
        acceptedAt: new Date(),
        estimatedCompletionAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      } as any);

      console.log('[ORDERS] Order accepted:', orderId, 'by provider:', user.id);

      // Create notification for requester
      await storage.createNotification({
        userId: order.requesterId,
        orderId: orderId,
        type: 'ORDER_ACCEPTED',
        title: 'Order Accepted',
        message: `Your order "${order.title}" has been accepted by a provider.`,
      } as any);

      res.json({
        success: true,
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status,
          providerId: updatedOrder.providerId,
          acceptedAt: updatedOrder.acceptedAt,
          estimatedCompletionAt: updatedOrder.estimatedCompletionAt,
        }
      });

    } catch (error) {
      console.error('[ORDERS] Error accepting order:', error);
      res.status(500).json({ error: 'Failed to accept order' });
    }
  });

  // Get single order details - JWT protected
  app.get('/api/orders/:orderId', authenticateTelegramUser, async (req, res) => {
    try {
      const authUser = (req as any).user as { id: string } | undefined;
      if (!authUser?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { orderId } = req.params;

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Check if user has access to this order
      if (order.requesterId !== authUser.id && order.providerId !== authUser.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        order: {
          id: order.id,
          title: order.title,
          description: order.description,
          mediaType: order.mediaType,
          location: order.location,
          budgetNanoTon: order.budgetNanoTon,
          status: order.status,
          isSampleOrder: order.isSampleOrder,
          createdAt: order.createdAt,
          acceptedAt: order.acceptedAt,
          deliveredAt: order.deliveredAt,
          estimatedCompletionAt: order.estimatedCompletionAt,
          requesterId: order.requesterId,
          providerId: order.providerId,
        }
      });

    } catch (error) {
      console.error('[ORDERS] Error getting order:', error);
      res.status(500).json({ error: 'Failed to get order' });
    }
  });
}