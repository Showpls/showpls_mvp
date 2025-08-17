import type { Express } from "express";
import { authenticateTelegramUser } from "../middleware/telegramAuth";
import { storage } from "../storage";

export function setupDisputeRoutes(app: Express) {
  // List disputes for an order
  app.get('/api/orders/:orderId/disputes', authenticateTelegramUser, async (req, res) => {
    try {
      const { orderId } = req.params as { orderId: string };
      const userId = (req as any).user?.id as string | undefined;
      if (!userId) return res.status(401).json({ error: 'Not authenticated' });

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.requesterId !== userId && order.providerId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const disputes = await storage.getOrderDisputes(orderId);
      return res.json(disputes);
    } catch (e) {
      console.error('[DISPUTES] list error:', e);
      return res.status(500).json({ error: 'Failed to fetch disputes' });
    }
  });

  // Create a dispute for an order
  app.post('/api/orders/:orderId/dispute', authenticateTelegramUser, async (req, res) => {
    try {
      const { orderId } = req.params as { orderId: string };
      const userId = (req as any).user?.id as string | undefined;
      const { reason, evidence } = (req.body || {}) as { reason?: string; evidence?: string[] };

      if (!userId) return res.status(401).json({ error: 'Not authenticated' });
      if (!reason || !reason.trim()) return res.status(400).json({ error: 'Reason required' });

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.requesterId !== userId && order.providerId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const dispute = await storage.createDispute({
        orderId,
        openedBy: userId,
        reason: reason.trim(),
        evidence: Array.isArray(evidence) ? evidence : [],
      });

      return res.json({ success: true, dispute });
    } catch (e) {
      console.error('[DISPUTES] create error:', e);
      return res.status(500).json({ error: 'Failed to create dispute' });
    }
  });

  // Add evidence to dispute
  app.put('/api/disputes/:disputeId/evidence', authenticateTelegramUser, async (req, res) => {
    try {
      const { disputeId } = req.params as { disputeId: string };
      const userId = (req as any).user?.id as string | undefined;
      const { evidence } = (req.body || {}) as { evidence?: string[] };

      if (!userId) return res.status(401).json({ error: 'Not authenticated' });
      if (!Array.isArray(evidence) || evidence.length === 0) {
        return res.status(400).json({ error: 'Evidence array required' });
      }

      // Load dispute to verify permissions
      const list = await (storage as any).getOrderDisputes ? undefined : undefined;
      // Fetch by disputeId via storage since we don't have a dedicated getter
      const orderDisputes = await storage.getOrderDisputes((await (async () => {
        // Temporary: find dispute by disputeId by scanning related orders is not feasible here.
        // Instead, query disputes table through storage helper by using getOrderDisputes requires orderId.
        // To avoid changing storage API now, do a minimal direct query via storage internals pattern used elsewhere.
        const db = (await import('../db')).db as any;
        const { disputes } = await import('@shared/schema');
        const { eq } = await import('drizzle-orm');
        const row = await db.query.disputes.findFirst({ where: eq((disputes as any).disputeId, disputeId) });
        if (!row) throw new Error('Dispute not found');
        return row.orderId as string;
      })()));

      const target = orderDisputes.find(d => (d as any).disputeId === disputeId);
      if (!target) return res.status(404).json({ error: 'Dispute not found' });

      // Only participants can add evidence
      const order = await storage.getOrder(target.orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.requesterId !== userId && order.providerId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updated = await storage.addDisputeEvidence(disputeId, evidence);
      return res.json({ success: true, dispute: updated });
    } catch (e) {
      console.error('[DISPUTES] add evidence error:', e);
      if ((e as any)?.message === 'Dispute not found') {
        return res.status(404).json({ error: 'Dispute not found' });
      }
      return res.status(500).json({ error: 'Failed to add evidence' });
    }
  });
}
