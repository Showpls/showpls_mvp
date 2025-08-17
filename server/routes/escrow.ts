import type { Express } from "express";
import { authenticateTelegramUser } from "../middleware/telegramAuth";
import { storage } from "../storage";
import { tonService } from "../services/ton";

// Simple in-memory idempotency for MVP (replace with real store if needed)
const processedOps = new Set<string>();

export function setupEscrowRoutes(app: Express) {
  // Fund escrow after creation
  app.post('/api/escrow/fund', authenticateTelegramUser, async (req, res) => {
    try {
      const { orderId } = req.body as { orderId?: string };
      const authUser = (req as any).user as { id: string } | undefined;
      if (!authUser?.id) return res.status(401).json({ error: 'Not authenticated' });
      if (!orderId) return res.status(400).json({ error: 'orderId required' });

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.requesterId !== authUser.id) return res.status(403).json({ error: 'Only requester can fund escrow' });
      if (!order.escrowAddress) return res.status(400).json({ error: 'Escrow not created yet' });

      const amount = BigInt(order.budgetNanoTon);
      const success = await tonService.fundEscrow(order.escrowAddress, amount);
      if (!success) return res.status(500).json({ error: 'Failed to fund escrow' });

      const updated = await storage.updateOrder(order.id, {
        status: 'FUNDED',
        updatedAt: new Date(),
      } as any);

      return res.json({ success: true, status: updated.status });
    } catch (e) {
      console.error('[ESCROW] fund error:', e);
      return res.status(500).json({ error: 'Failed to fund escrow' });
    }
  });

  // Create escrow for an order (uses provider wallet from DB)
  app.post('/api/escrow/create', authenticateTelegramUser, async (req, res) => {
    try {
      const { orderId } = req.body as { orderId?: string };
      const authUser = (req as any).user as { id: string } | undefined;
      if (!authUser?.id) return res.status(401).json({ error: 'Not authenticated' });
      if (!orderId) return res.status(400).json({ error: 'orderId required' });

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.requesterId !== authUser.id) return res.status(403).json({ error: 'Only requester can create escrow' });
      if (order.status !== 'CREATED') return res.status(400).json({ error: 'Escrow can be created only for CREATED orders' });

      const requesterAddress = (await storage.getUser(order.requesterId))?.walletAddress;
      if (!requesterAddress) return res.status(400).json({ error: 'Requester wallet not set' });
      const providerAddress = order.providerId ? (await storage.getUser(order.providerId))?.walletAddress : undefined;
      if (!providerAddress) return res.status(400).json({ error: 'Provider wallet required (provider must accept and connect wallet)' });

      const validProv = await tonService.validateWalletAddress(providerAddress);
      const validReq = await tonService.validateWalletAddress(requesterAddress);
      if (!validProv || !validReq) return res.status(400).json({ error: 'Invalid wallet address' });

      const amount = BigInt(order.budgetNanoTon);
      const contract = await tonService.createEscrowContract(order.id, amount, requesterAddress, providerAddress);

      const updated = await storage.updateOrder(order.id, {
        escrowAddress: contract.address.toString(),
        // Keep status CREATED until verify-funding confirms deposit
        updatedAt: new Date(),
      } as any);

      return res.json({ success: true, escrowAddress: updated.escrowAddress, status: updated.status });
    } catch (e) {
      console.error('[ESCROW] create error:', e);
      return res.status(500).json({ error: 'Failed to create escrow' });
    }
  });

  // Verify funding (MVP stub)
  app.post('/api/escrow/verify-funding', authenticateTelegramUser, async (req, res) => {
    try {
      const { orderId, opId } = req.body as { orderId?: string; opId?: string };
      const authUser = (req as any).user as { id: string } | undefined;
      if (!authUser?.id) return res.status(401).json({ error: 'Not authenticated' });
      if (!orderId) return res.status(400).json({ error: 'orderId required' });
      if (opId && processedOps.has(opId)) return res.json({ success: true, idempotent: true });

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.requesterId !== authUser.id) return res.status(403).json({ error: 'Only requester can verify funding' });
      if (!order.escrowAddress) return res.status(400).json({ error: 'Escrow not created' });

      // In real impl: query chain to confirm transfer
      const status = await tonService.getEscrowStatus(order.escrowAddress);
      if (status !== 'funded') return res.status(400).json({ error: 'Escrow not funded yet' });

      const updated = await storage.updateOrder(order.id, {
        status: 'IN_PROGRESS',
        updatedAt: new Date(),
      } as any);

      if (opId) processedOps.add(opId);
      return res.json({ success: true, status: updated.status });
    } catch (e) {
      console.error('[ESCROW] verify error:', e);
      return res.status(500).json({ error: 'Failed to verify funding' });
    }
  });

  // Release escrow (approve delivery)
  app.post('/api/escrow/release', authenticateTelegramUser, async (req, res) => {
    try {
      const { orderId, opId } = req.body as { orderId?: string; opId?: string };
      const authUser = (req as any).user as { id: string } | undefined;
      if (!authUser?.id) return res.status(401).json({ error: 'Not authenticated' });
      if (!orderId) return res.status(400).json({ error: 'orderId required' });
      if (opId && processedOps.has(opId)) return res.json({ success: true, idempotent: true });

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.requesterId !== authUser.id) return res.status(403).json({ error: 'Only requester can release escrow' });
      if (order.status !== 'DELIVERED' && order.status !== 'IN_PROGRESS') return res.status(400).json({ error: 'Order not ready for approval' });
      if (!order.escrowAddress) return res.status(400).json({ error: 'Escrow not created' });

      const providerAddress = (await storage.getUser(order.providerId!))?.walletAddress;
      if (!providerAddress) return res.status(400).json({ error: 'Provider wallet not set' });
      const amount = BigInt(order.budgetNanoTon) - ((BigInt(order.budgetNanoTon) * BigInt(order.platformFeeBps)) / BigInt(10000));
      const ok = await tonService.releaseEscrow(order.escrowAddress, providerAddress, amount);
      if (!ok) return res.status(500).json({ error: 'Escrow release failed' });

      const updated = await storage.updateOrder(order.id, {
        status: 'APPROVED',
        approvedAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Send notification to provider
      const provider = await storage.getUser(order.providerId!);
      if (provider?.telegramId) {
        const { notificationService } = await import('../services/notifications');
        await notificationService.sendNotification({
          userId: provider.telegramId,
          title: 'Payment Released!',
          message: `Payment for order "${order.title}" has been released. The funds are now in your wallet.`,
          type: 'payment',
          metadata: { orderId: order.id }
        });
      }

      if (opId) processedOps.add(opId);
      return res.json({ success: true, status: updated.status });
    } catch (e) {
      console.error('[ESCROW] release error:', e);
      return res.status(500).json({ error: 'Failed to release escrow' });
    }
  });

  // Refund escrow (dispute/refund path)
  app.post('/api/escrow/refund', authenticateTelegramUser, async (req, res) => {
    try {
      const { orderId, opId } = req.body as { orderId?: string; opId?: string };
      const authUser = (req as any).user as { id: string } | undefined;
      if (!authUser?.id) return res.status(401).json({ error: 'Not authenticated' });
      if (!orderId) return res.status(400).json({ error: 'orderId required' });
      if (opId && processedOps.has(opId)) return res.json({ success: true, idempotent: true });

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.requesterId !== authUser.id) return res.status(403).json({ error: 'Only requester can refund escrow' });
      if (!order.escrowAddress) return res.status(400).json({ error: 'Escrow not created' });

      const requesterAddress = (await storage.getUser(order.requesterId))?.walletAddress;
      if (!requesterAddress) return res.status(400).json({ error: 'Requester wallet not set' });
      const ok = await tonService.refundEscrow(order.escrowAddress, requesterAddress, BigInt(order.budgetNanoTon));
      if (!ok) return res.status(500).json({ error: 'Escrow refund failed' });

      const updated = await storage.updateOrder(order.id, {
        status: 'REFUNDED',
        updatedAt: new Date(),
      } as any);

      // Send notification to requester
      const requester = await storage.getUser(order.requesterId);
      if (requester?.telegramId) {
        const { notificationService } = await import('../services/notifications');
        await notificationService.sendNotification({
          userId: requester.telegramId,
          title: 'Refund Processed',
          message: `Your refund for order "${order.title}" has been processed. The funds have been returned to your wallet.`,
          type: 'payment',
          metadata: { orderId: order.id }
        });
      }

      if (opId) processedOps.add(opId);
      return res.json({ success: true, status: updated.status });
    } catch (e) {
      console.error('[ESCROW] refund error:', e);
      return res.status(500).json({ error: 'Failed to refund escrow' });
    }
  });

  // Pause escrow (dispute flow)
  app.post('/api/escrow/pause', authenticateTelegramUser, async (req, res) => {
    try {
      const { orderId, opId } = req.body as { orderId?: string; opId?: string };
      const authUser = (req as any).user as { id: string } | undefined;
      if (!authUser?.id) return res.status(401).json({ error: 'Not authenticated' });
      if (!orderId) return res.status(400).json({ error: 'orderId required' });
      if (opId && processedOps.has(opId)) return res.json({ success: true, idempotent: true });

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.requesterId !== authUser.id) return res.status(403).json({ error: 'Only requester can pause escrow' });
      if (!order.escrowAddress) return res.status(400).json({ error: 'Escrow not created' });

      const ok = await tonService.pauseEscrow(order.escrowAddress);
      if (!ok) return res.status(500).json({ error: 'Failed to pause escrow' });

      if (opId) processedOps.add(opId);
      return res.json({ success: true });
    } catch (e) {
      console.error('[ESCROW] pause error:', e);
      return res.status(500).json({ error: 'Failed to pause escrow' });
    }
  });
}
