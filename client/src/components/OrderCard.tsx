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
        try { throw new Error(JSON.parse(txt).error || 'Failed to prepare funding'); } catch { throw new Error('Failed to prepare funding'); }
      }
      const fund = await prepRes.json() as { address: string; amountNano: string; bodyBase64?: string; stateInit?: string };
      const msg: any = { address: fund.address, amount: fund.amountNano, bounce: false };
      if (fund.bodyBase64 && fund.bodyBase64.length > 0) msg.payload = fund.bodyBase64;
      if ((fund as any).stateInit) msg.stateInit = (fund as any).stateInit;
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 60 * 5,
        messages: [msg]
      });
      const verifyRes = await fetch('/api/escrow/verify-funding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderId: order.id, opId: `verify_${order.id}_${Date.now()}` })
      });
      if (!verifyRes.ok) {
        const txt = await verifyRes.text();
        try { throw new Error(JSON.parse(txt).error || 'Failed to verify funding'); } catch { throw new Error('Failed to verify funding'); }
      }
      // After successful funding, go to chat
      window.location.href = `/chat/${order.id}`;
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
