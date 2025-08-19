import type { Express } from "express";
import { authenticateTelegramUser } from "../middleware/telegramAuth";
import { storage } from "../storage";
import { tonService } from "../services/ton";

// Simple in-memory idempotency for MVP (replace with real store if needed)
const processedOps = new Set<string>();

export function setupEscrowRoutes(app: Express) {
  // Check wallet balance sufficiency for funding an amount (in nanoTON)
  app.post('/api/ton/check-balance', authenticateTelegramUser, async (req, res) => {
    try {
      const { requiredNano } = req.body as { requiredNano?: string | number };
      const authUser = (req as any).user as { id: string } | undefined;
      if (!authUser?.id) return res.status(401).json({ error: 'Not authenticated' });
      if (requiredNano === undefined || requiredNano === null) return res.status(400).json({ error: 'requiredNano is required' });

      const user = await storage.getUser(authUser.id);
      if (!user?.walletAddress) return res.status(400).json({ error: 'Wallet not connected' });

      const required = BigInt(requiredNano);
      const { sufficient, balance, required: totalRequired } = await tonService.checkSufficientBalance(user.walletAddress, required);
      return res.json({ sufficient, balance: balance.toString(), required: totalRequired.toString(), walletAddress: user.walletAddress });
    } catch (e) {
      console.error('[TON] check-balance error:', e);
      return res.status(500).json({ error: 'Failed to check balance' });
    }
  });

  // Mark approved after client-side approval transaction (MVP)
  app.post('/api/escrow/mark-approved', authenticateTelegramUser, async (req, res) => {
    try {
      const { orderId, opId } = req.body as { orderId?: string; opId?: string };
      const authUser = (req as any).user as { id: string } | undefined;
      if (!authUser?.id) return res.status(401).json({ error: 'Not authenticated' });
      if (!orderId) return res.status(400).json({ error: 'orderId required' });
      if (opId && processedOps.has(opId)) return res.json({ success: true, idempotent: true });

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.requesterId !== authUser.id) return res.status(403).json({ error: 'Only requester can mark approved' });
      if (!order.escrowAddress) return res.status(400).json({ error: 'Escrow not created' });

      const updated = await storage.updateOrder(order.id, {
        status: 'APPROVED',
        approvedAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Notify provider
      const provider = await storage.getUser(order.providerId!);
      if (provider?.telegramId) {
        const { notificationService } = await import('../services/notifications');
        await notificationService.sendNotification({
          userId: provider.telegramId,
          title: 'Payment Released!',
          message: `Payment for order "${order.title}" has been released. The funds are on the way to your wallet.`,
          type: 'payment',
          metadata: { orderId: order.id }
        });
      }

      if (opId) processedOps.add(opId);
      return res.json({ success: true, status: updated.status });
    } catch (e) {
      console.error('[ESCROW] mark-approved error:', e);
      return res.status(500).json({ error: 'Failed to mark approved' });
    }
  });

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
        // escrowInitData is stored but not in typed schema
        escrowInitData: contract.stateInit as any,
        // Keep status CREATED until verify-funding confirms deposit
        updatedAt: new Date(),
      } as any);

      // Provide client-side funding payload details
      const fund = tonService.prepareFundingTx({
        escrowAddress: updated.escrowAddress!,
        amountNano: amount,
        includeStateInit: (updated as any).escrowInitData as string,
      });

      const Address = (await import('@ton/core')).Address;
      const addrOptsCreate: any = { urlSafe: true, bounceable: false };
      if ((process.env.TON_NETWORK || process.env.NODE_ENV) === 'testnet') addrOptsCreate.testOnly = true;
      const nonBounceAddr = Address.parse(updated.escrowAddress!).toString(addrOptsCreate);
      return res.json({ 
        success: true, 
        escrowAddress: nonBounceAddr, 
        escrowInitData: updated.escrowInitData,
        fund: {
          address: Address.parse(fund.address).toString(addrOptsCreate),
          amountNano: fund.amountNano,
          bodyBase64: fund.bodyBase64,
          stateInit: fund.stateInit,
        },
        status: updated.status 
      });
    } catch (e) {
      console.error('[ESCROW] create error:', e);
      return res.status(500).json({ error: 'Failed to create escrow' });
    }
  });

  // Prepare funding transaction (idempotent helper)
  app.post('/api/escrow/prepare-fund', authenticateTelegramUser, async (req, res) => {
    try {
      const { orderId } = req.body as { orderId?: string };
      const authUser = (req as any).user as { id: string } | undefined;
      if (!authUser?.id) return res.status(401).json({ error: 'Not authenticated' });
      if (!orderId) return res.status(400).json({ error: 'orderId required' });

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.requesterId !== authUser.id) return res.status(403).json({ error: 'Only requester can fund escrow' });
      if (!order.escrowAddress || !order.escrowInitData) return res.status(400).json({ error: 'Escrow not ready' });

      // Include stateInit only if contract is not yet active (first deploy + fund)
      const isActive = await tonService.isContractActive(order.escrowAddress);
      const fund = tonService.prepareFundingTx({
        escrowAddress: order.escrowAddress,
        amountNano: BigInt(order.budgetNanoTon),
        includeStateInit: isActive ? undefined : (order as any).escrowInitData,
      });

      const Address = (await import('@ton/core')).Address;
      const addrOptsFund: any = { urlSafe: true, bounceable: false };
      if ((process.env.TON_NETWORK || process.env.NODE_ENV) === 'testnet') addrOptsFund.testOnly = true;
      return res.json({
        address: Address.parse(fund.address).toString(addrOptsFund),
        amountNano: fund.amountNano,
        bodyBase64: fund.bodyBase64,
        stateInit: fund.stateInit,
      });
    } catch (e) {
      console.error('[ESCROW] prepare-fund error:', e);
      return res.status(500).json({ error: 'Failed to prepare funding transaction' });
    }
  });

  // Prepare approval transaction (requester approves delivery)
  app.post('/api/escrow/prepare-approve', authenticateTelegramUser, async (req, res) => {
    try {
      const { orderId } = req.body as { orderId?: string };
      const authUser = (req as any).user as { id: string } | undefined;
      if (!authUser?.id) return res.status(401).json({ error: 'Not authenticated' });
      if (!orderId) return res.status(400).json({ error: 'orderId required' });

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.requesterId !== authUser.id) return res.status(403).json({ error: 'Only requester can approve' });
      if (!order.escrowAddress) return res.status(400).json({ error: 'Escrow not created' });
      if (order.status !== 'DELIVERED' && order.status !== 'IN_PROGRESS') return res.status(400).json({ error: 'Order not ready for approval' });

      const approve = tonService.prepareApproveTx({ escrowAddress: order.escrowAddress });

      const Address = (await import('@ton/core')).Address;
      const addrOptsApprove: any = { urlSafe: true, bounceable: false };
      if ((process.env.TON_NETWORK || process.env.NODE_ENV) === 'testnet') addrOptsApprove.testOnly = true;
      return res.json({
        address: Address.parse(approve.address).toString(addrOptsApprove),
        amountNano: approve.amountNano,
        bodyBase64: approve.bodyBase64,
      });
    } catch (e) {
      console.error('[ESCROW] prepare-approve error:', e);
      return res.status(500).json({ error: 'Failed to prepare approve transaction' });
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

      // Calculate provider amount (90% after platform fee)
      const platformFee = (BigInt(order.budgetNanoTon) * BigInt(1000)) / BigInt(10000); // 10% fee
      const providerAmount = BigInt(order.budgetNanoTon) - platformFee;

      const ok = await tonService.releaseEscrow(order.escrowAddress, providerAddress, providerAmount);
      if (!ok) return res.status(500).json({ error: 'Escrow release failed' });

      // Send platform fee to fee receiver wallet
      const feeReceiverWallet = process.env.FEE_RECEIVER_WALLET;
      if (feeReceiverWallet && platformFee > 0) {
        await tonService.releaseEscrow(order.escrowAddress, feeReceiverWallet, platformFee);
      }

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
