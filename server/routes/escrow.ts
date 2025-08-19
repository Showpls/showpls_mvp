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
      try {
        console.log('[ESCROW] create request', {
          orderId: order.id,
          requesterId: authUser.id,
          headers: { ua: req.headers['user-agent'] },
          ip: req.ip,
          orderStatus: order.status,
          amountNano: String(order.budgetNanoTon),
          requesterAddress,
          providerAddress,
          network: process.env.TON_NETWORK || process.env.NODE_ENV,
        });
      } catch {}
      const contract = await tonService.createEscrowContract(order.id, amount, requesterAddress, providerAddress);

      const updated = await storage.updateOrder(order.id, {
        escrowAddress: contract.address.toString(),
        // escrowInitData is stored but not in typed schema
        escrowInitData: contract.stateInit as any,
        // Move to PENDING_FUNDING to enable client UX
        status: 'PENDING_FUNDING',
        updatedAt: new Date(),
      } as any);

      // Provide client-side funding payload details
      const fund = tonService.prepareFundingTx({
        escrowAddress: updated.escrowAddress!,
        amountNano: amount,
        includeStateInit: (updated as any).escrowInitData as string,
      });

      const Address = (await import('@ton/core')).Address;
      const addrOptsCreateNonBounce: any = { urlSafe: true, bounceable: false };
      const addrOptsCreateBounce: any = { urlSafe: true, bounceable: true };
      if ((process.env.TON_NETWORK || process.env.NODE_ENV) === 'testnet') {
        addrOptsCreateNonBounce.testOnly = true;
        addrOptsCreateBounce.testOnly = true;
      }
      const nonBounceAddr = Address.parse(updated.escrowAddress!).toString(addrOptsCreateNonBounce);
      const bounceAddr = Address.parse(updated.escrowAddress!).toString(addrOptsCreateBounce);
      try {
        console.log('[ESCROW] create response', {
          orderId: order.id,
          escrowAddress: (contract.address as any)?.toString?.() ?? contract.address,
          stateInitPrefix: String(contract.stateInit).slice(0, 32),
        });
      } catch {}
      // If env requests single-message deploy+fund, include stateInit on the funding message itself
      const singleMsg = process.env.TON_ESCROW_SINGLE_MSG === '1';
      if (singleMsg) {
        const response = {
          success: true,
          escrowAddress: nonBounceAddr,
          escrowInitData: updated.escrowInitData,
          fund: {
            address: nonBounceAddr,
            amountNano: fund.amountNano,
            bodyBase64: fund.bodyBase64,
            stateInit: fund.stateInit,
          },
          status: updated.status
        } as const;
        try {
          console.log('[ESCROW] create response (single deploy+fund)', {
            orderId: order.id,
            amountNano: fund.amountNano,
            hasStateInit: !!fund.stateInit,
          });
        } catch {}
        return res.json(response);
      }

      // Default: return two messages: deploy + fund
      const deployValueStr = process.env.TON_ESCROW_DEPLOY_RESERVE ?? '0.05';
      const { toNano } = await import('@ton/core');
      const deployAmount = toNano(deployValueStr).toString();
      const response = {
        success: true,
        escrowAddress: nonBounceAddr,
        escrowInitData: updated.escrowInitData,
        fund: {
          messages: [
            { address: nonBounceAddr, amountNano: deployAmount, stateInit: fund.stateInit, bounce: false },
            { address: bounceAddr, amountNano: fund.amountNano, bodyBase64: fund.bodyBase64, bounce: true },
          ]
        },
        status: updated.status
      } as const;
      try {
        console.log('[ESCROW] create response (deploy+fund)', {
          orderId: order.id,
          deployAmount,
          fundAmount: fund.amountNano,
        });
      } catch {}
      return res.json(response);
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
      try {
        console.log('[ESCROW] prepare-fund request', {
          orderId: order.id,
          requesterId: authUser.id,
          headers: { ua: req.headers['user-agent'] },
          ip: req.ip,
          orderStatus: order.status,
          budgetNano: String(order.budgetNanoTon),
          escrowAddress: order.escrowAddress,
          hasInitData: !!order.escrowInitData,
          isActive,
          network: process.env.TON_NETWORK || process.env.NODE_ENV,
        });
      } catch {}
      const fund = tonService.prepareFundingTx({
        escrowAddress: order.escrowAddress,
        amountNano: BigInt(order.budgetNanoTon),
        includeStateInit: isActive ? undefined : (order as any).escrowInitData,
      });

      const Address = (await import('@ton/core')).Address;
      const isTestnetNet = (process.env.TON_NETWORK || process.env.NODE_ENV) === 'testnet';
      const addrNonBounce: any = { urlSafe: true, bounceable: false };
      const addrBounce: any = { urlSafe: true, bounceable: true };
      if (isTestnetNet) { addrNonBounce.testOnly = true; addrBounce.testOnly = true; }

      const formattedAddress = Address.parse(fund.address).toString(addrNonBounce);

      // Diagnostics: log prepared funding details (abbreviated)
      try {
        const deployReserveStr = process.env.TON_ESCROW_DEPLOY_RESERVE ?? '0.05';
        const fundReserveStr = process.env.TON_ESCROW_FUND_RESERVE ?? '0.1';
        console.log('[ESCROW] prepare-fund', {
          orderId: order.id,
          isActive,
          formattedAddress,
          hasStateInit: !!fund.stateInit,
          bodyPrefix: fund.bodyBase64 ? String(fund.bodyBase64).slice(0, 24) : undefined,
          stateInitPrefix: fund.stateInit ? String(fund.stateInit).slice(0, 24) : undefined,
          amountNano: fund.amountNano,
          deployReserveStr,
          fundReserveStr,
        });
      } catch {}

      // If stateInit is needed (first deploy), optionally return single-message or default to two messages
      if (fund.stateInit) {
        const singleMsg = process.env.TON_ESCROW_SINGLE_MSG === '1';
        if (singleMsg) {
          const response = {
            address: formattedAddress,
            amountNano: fund.amountNano,
            bodyBase64: fund.bodyBase64,
            stateInit: fund.stateInit,
          } as const;
          try {
            console.log('[ESCROW] prepare-fund response (single deploy+fund)', {
              orderId: order.id,
              amountNano: fund.amountNano,
              hasStateInit: !!fund.stateInit,
            });
          } catch {}
          return res.json(response);
        }

        const deployValueStr = process.env.TON_ESCROW_DEPLOY_RESERVE ?? '0.05';
        const { toNano } = await import('@ton/core');
        const deployAmount = toNano(deployValueStr).toString();
        // IMPORTANT: Do not reduce the fund transfer. Contract checks msg_value of funding tx alone.
        const formattedBounceAddr = Address.parse(fund.address).toString(addrBounce);
        const response = {
          messages: [
            { address: formattedAddress, amountNano: deployAmount, stateInit: fund.stateInit, bounce: false },
            { address: formattedBounceAddr, amountNano: fund.amountNano, bodyBase64: fund.bodyBase64, bounce: true },
          ]
        } as const;
        try {
          console.log('[ESCROW] prepare-fund response (deploy+fund)', {
            orderId: order.id,
            deployAmount,
            fundAmount: fund.amountNano,
          });
        } catch {}
        return res.json(response);
      }

      // Otherwise, keep legacy single-message shape
      const singleResponse = {
        address: formattedAddress,
        amountNano: fund.amountNano,
        bodyBase64: fund.bodyBase64,
      };
      try {
        console.log('[ESCROW] prepare-fund response (single)', {
          orderId: order.id,
          amountNano: fund.amountNano,
        });
      } catch {}
      return res.json(singleResponse);
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

      // In real impl: query chain to confirm transfer. Require value >= budget to avoid counting deploy tx.
      try {
        console.log('[ESCROW] verify-funding request', {
          orderId: order.id,
          requesterId: authUser.id,
          opId,
          headers: { ua: req.headers['user-agent'] },
          ip: req.ip,
          escrowAddress: order.escrowAddress,
          budgetNano: String(order.budgetNanoTon),
          when: new Date().toISOString(),
          network: process.env.TON_NETWORK || process.env.NODE_ENV,
        });
      } catch {}
      const status = await tonService.getEscrowStatus(order.escrowAddress, BigInt(order.budgetNanoTon));
      try {
        console.log('[ESCROW] verify-funding result', {
          orderId: order.id,
          escrowAddress: order.escrowAddress,
          status,
          budgetNano: String(order.budgetNanoTon),
        });
      } catch {}
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
