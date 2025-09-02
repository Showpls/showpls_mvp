import { Router } from 'express';
import { db } from '../db';
import { chatMessages, orders } from '../../shared/schema';
import { and, eq } from 'drizzle-orm';
import { authenticateEither } from '../middleware/telegramAuth';
import { insertChatMessageSchema } from '../../shared/schema';

const router = Router();

// GET /api/orders/:orderId/messages - Fetch messages for an order
router.get('/orders/:orderId/messages', authenticateEither, async (req, res) => {
  const { orderId } = req.params;
  const currentUser = req.user;

  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // 1. Find the order
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: {
        requesterId: true,
        providerId: true,
        status: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 2. Check if the order is active and the user has permission
    const isRequester = order.requesterId === currentUser.id;
    const isProvider = order.providerId === currentUser.id;
    const allowedStatuses = ['FUNDED', 'IN_PROGRESS', 'DELIVERED', 'APPROVED'];
    const isOrderActive = order.providerId !== null && allowedStatuses.includes((order as any).status);

    if (!isOrderActive) {
      return res.status(403).json({ error: 'Chat is not available for this order yet.' });
    }

    if (!isRequester && !isProvider) {
      return res.status(403).json({ error: 'You do not have access to this chat.' });
    }

    // 3. Fetch messages for the order
    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.orderId, orderId),
      with: {
        sender: {
          columns: {
            id: true,
            username: true,
            firstName: true,
            photoUrl: true,
          },
        },
      },
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    });

    res.json(messages);
  } catch (error) {
    console.error('Failed to fetch chat messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:orderId/messages - Send a new message
router.post('/orders/:orderId/messages', authenticateEither, async (req, res) => {
  const { orderId } = req.params;
  const currentUser = req.user;

  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // 1. Validate request body
    const validationResult = insertChatMessageSchema.safeParse({
      ...req.body,
      orderId: orderId,
      senderId: currentUser.id,
    });

    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid message data', details: validationResult.error.errors });
    }

    const { message, mediaUrl } = req.body;

    // 2. Find the order and check permissions
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: {
        id: true,
        requesterId: true,
        providerId: true,
        status: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const isRequester = order.requesterId === currentUser.id;
    const isProvider = order.providerId === currentUser.id;
    const allowedStatuses = ['FUNDED', 'IN_PROGRESS', 'DELIVERED', 'APPROVED'];
    const isOrderActive = order.providerId !== null && allowedStatuses.includes((order as any).status);

    if (!isOrderActive) {
        return res.status(403).json({ error: 'Chat is not available for this order yet.' });
    }

    if (!isRequester && !isProvider) {
      return res.status(403).json({ error: 'You do not have permission to send messages in this chat.' });
    }

    // 3. Insert the new message
    const [newMessage] = await db
      .insert(chatMessages)
      .values({
        orderId: order.id,
        senderId: currentUser?.id,
        message: message,
        messageType: mediaUrl ? 'image' : 'text',
        metadata: mediaUrl ? { mediaUrl } : undefined,
      })
      .returning();

    // TODO: Broadcast the message via WebSocket to the other party

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Failed to send message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
