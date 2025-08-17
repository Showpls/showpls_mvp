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

interface OrderCardProps {
  order: OrderWithRelations;
}

export function OrderCard({ order }: OrderCardProps) {
  const [tonConnectUI] = useTonConnectUI();
  const { data: user } = useQuery<{ id: string } | undefined>({ queryKey: ['/api/me'] });
  const { t, i18n } = useTranslation();

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

  return (
    <Card className="glass-panel border-brand-primary/20 hover:bg-brand-primary/5 transition-all">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
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
          <div className="text-right">
            <div className="text-sm font-medium text-brand-accent">+{formatTON(order.budgetNanoTon)}</div>
            <div className="text-xs text-text-muted">
              {order.createdAt ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: i18n.language === 'ru' ? ru : undefined }) : ''}
            </div>
          </div>
        </div>
        {isOrderActive && (
          <div className="flex justify-end mt-2">
             <Link href={`/chat/${order.id}`}>
                <Button size="sm" variant="outline" className="border-brand-primary/30">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {t('order.chat')}
                </Button>
              </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
