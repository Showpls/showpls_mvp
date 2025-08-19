import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Camera, Video, Radio, MessageSquare } from "lucide-react";
import type { OrderWithRelations } from "@shared/schema";
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useState } from "react";
import { getAuthToken } from "@/lib/auth";

interface OrderCardProps {
  order: OrderWithRelations;
}

export function OrderCard({ order }: OrderCardProps) {
  const [tonConnectUI] = useTonConnectUI();
  const { data: user } = useQuery<{ id: string } | undefined>({ queryKey: ['/api/me'] });
  const { t, i18n } = useTranslation();
  const [isFunding, setIsFunding] = useState(false);
  const [fundError, setFundError] = useState<string | null>(null);

  const formatTON = (nanoTon: string | number): string => {
    const ton = Number(nanoTon) / 1e9;
    return `${ton.toLocaleString()} TON`;
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'photo': return <Camera className="w-5 h-5 text-brand-primary" />;
      case 'video': return <Video className="w-5 h-5 text-brand-accent" />;
      case 'live': return <Radio className="w-5 h-5 text-green-500" />;
      default: return null;
    }
  };

  const isOrderActive = order.providerId !== null;
  const allowedChatStatuses = ['FUNDED', 'IN_PROGRESS', 'DELIVERED', 'APPROVED'] as const;
  const chatEnabled = allowedChatStatuses.includes(order.status as any);
  const isRequester = !!(user?.id && order.requesterId === user.id);

  const handleFundNow = async () => {
    setFundError(null);
    setIsFunding(true);
    try {
      const token = getAuthToken();
      // 1) Try to create escrow (fresh per transaction)
      let fund: any;
      let createTried = false;
      try {
        createTried = true;
        const createRes = await fetch('/api/escrow/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ orderId: order.id })
        });
        if (createRes.ok) {
          const cj = await createRes.json();
          // New route wraps messages under fund
          fund = cj?.fund ?? cj;
        } else {
          const txt = await createRes.text();
          const msg = (() => { try { return JSON.parse(txt).error as string; } catch { return ''; } })();
          // If cannot create (wrong status, already created), fallback to prepare-fund
          if (!msg || !/Escrow can be created only|Escrow not created yet|Only requester|Provider wallet required/i.test(msg)) {
            // continue to fallback silently
          }
        }
      } catch {
        // ignore and fallback
      }

      // 2) If create did not return fund payload, prepare fund for existing escrow
      if (!fund) {
        const prepRes = await fetch('/api/escrow/prepare-fund', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ orderId: order.id })
        });
        if (!prepRes.ok) {
          const txt = await prepRes.text();
          let base = 'Failed to prepare funding';
          try { base = JSON.parse(txt).error || base; } catch {}
          throw new Error(base);
        }
        fund = await prepRes.json();
      }

      // fund can be { messages: [...] } or single-message shape
      const fundShape = fund as
        | { address: string; amountNano: string; bodyBase64?: string; stateInit?: string }
        | { messages: Array<{ address: string; amountNano: string; bodyBase64?: string; stateInit?: string; bounce?: boolean }> };

      let messages: any[];
      if ('messages' in fundShape && Array.isArray((fundShape as any).messages)) {
        const arr = (fundShape as any).messages as any[];
        messages = arr.map((m) => {
          const out: any = { address: m.address, amount: m.amountNano, bounce: m.bounce ?? false };
          if (m.bodyBase64) out.payload = m.bodyBase64;
          if (m.stateInit) out.stateInit = m.stateInit;
          return out;
        });
      } else {
        const single = fundShape as { address: string; amountNano: string; bodyBase64?: string; stateInit?: string };
        const msg: any = { address: single.address, amount: single.amountNano, bounce: false };
        if (single.bodyBase64) msg.payload = single.bodyBase64;
        if (single.stateInit) msg.stateInit = single.stateInit;
        messages = [msg];
      }

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 60 * 5,
        messages
      });
      // Poll verification for a short period to allow indexer to catch up
      const opId = `verify_${order.id}_${Date.now()}`;
      const maxAttempts = 12; // ~36s total at 3s interval
      const intervalMs = 3000;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const verifyRes = await fetch('/api/escrow/verify-funding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ orderId: order.id, opId })
        });
        if (verifyRes.ok) {
          // After successful funding, go to chat
          window.location.href = `/chat/${order.id}`;
          return;
        }
        const txt = await verifyRes.text();
        let errMsg = 'Failed to verify funding';
        try { errMsg = JSON.parse(txt).error || errMsg; } catch {}
        // If not yet funded, keep polling; otherwise, surface error
        if (errMsg.toLowerCase().includes('not funded yet')) {
          await new Promise(r => setTimeout(r, intervalMs));
          continue;
        }
        throw new Error(errMsg);
      }
      throw new Error('Verification timeout. Please check your wallet and try again.');
    } catch (e: any) {
      setFundError(e?.message || 'Funding failed');
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <Card className="glass-panel border-brand-primary/20 hover:bg-brand-primary/5 transition-all">
      <CardContent className="p-3">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          {/* Left column: icon + title/status and chat button below */}
          <div>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-brand-primary/20 rounded-full flex items-center justify-center mr-3">
                {getMediaIcon(order.mediaType)}
              </div>
              <div>
                <div className="font-medium text-sm truncate w-40">{order.title}</div>
                <div className="text-xs text-text-muted capitalize">
                  {t(`order.status.${order.status.toLowerCase()}`)}
                </div>
              </div>
            </div>
            {isOrderActive && (
              <div className="mt-2">
                {chatEnabled ? (
                  <Link href={`/chat/${order.id}`}>
                    <Button size="sm" variant="outline" className="border-brand-primary/30">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {t('order.chat')}
                    </Button>
                  </Link>
                ) : order.status === 'PENDING_FUNDING' && isRequester ? (
                  <div className="space-y-1">
                    {fundError && (
                      <div className="text-[11px] text-red-400">{fundError}</div>
                    )}
                    <Button size="sm" onClick={handleFundNow} disabled={isFunding} className="bg-yellow-500 text-black hover:bg-yellow-600">
                      {isFunding ? t('order.processing') || 'Processing…' : t('order.fundNow') || 'Fund Now'}
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Right column: amount top-right and time bottom-right */}
          <div className="flex flex-col items-end justify-between">
            <div className="text-sm font-medium text-brand-accent">+{formatTON(order.budgetNanoTon)}</div>
            <div className="text-xs text-text-muted">
              {order.createdAt ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: i18n.language === 'ru' ? ru : undefined }) : ''}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
