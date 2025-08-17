import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Camera, Video, Radio, MapPin, Clock, MessageSquare } from "lucide-react";
import type { OrderWithRelations } from "@shared/schema";

interface OrderCardProps {
  order: OrderWithRelations;
  showActions?: boolean;
}

export function OrderCard({ order, showActions = false }: OrderCardProps) {
  const [tonConnectUI] = useTonConnectUI();
  const { data: user } = useQuery<{ id: string } | undefined>({ queryKey: ['/api/me'] });
  const { t } = useTranslation();

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'photo': return <Camera className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'live': return <Radio className="w-4 h-4" />;
      default: return <Camera className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return 'bg-blue-500/20 text-blue-400';
      case 'PENDING_FUNDING': return 'bg-orange-500/20 text-orange-400';
      case 'FUNDED': return 'bg-green-500/20 text-green-400';
      case 'IN_PROGRESS': return 'bg-yellow-500/20 text-yellow-400';
      case 'DELIVERED': return 'bg-purple-500/20 text-purple-400';
      case 'APPROVED': return 'bg-green-500/20 text-green-400';
      case 'DISPUTED': return 'bg-red-500/20 text-red-400';
      case 'REFUNDED': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <Card className="glass-panel border-brand-primary/20 hover:bg-brand-primary/5 transition-all">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            {getMediaIcon(order.mediaType)}
            <h3 className="font-semibold text-sm">{order.title}</h3>
          </div>
          <Badge className={`text-xs ${getStatusColor(order.status)}`}>
            {t(`order.status.${order.status.toLowerCase()}`)}
          </Badge>
        </div>

        <p className="text-text-muted text-sm mb-3 line-clamp-2">
          {order.description}
        </p>

        <div className="flex items-center justify-between text-xs text-text-muted mb-3">
          <div className="flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            <span>{order.location?.address || t('order.locationUnknown')}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            <span>{order.createdAt ? new Date(order.createdAt as unknown as string).toLocaleDateString() : ''}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="font-semibold text-brand-accent">
            {Number(order.budgetNanoTon) / 1e9} TON
          </div>
          <div className="flex items-center space-x-2">
            {(order.status === 'IN_PROGRESS' || order.status === 'DELIVERED') && (
              <Link href={`/chat/${order.id}`}>
                <Button size="sm" variant="outline" className="border-brand-primary/30">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  {t('order.chat')}
                </Button>
              </Link>
            )}
            {user?.id === order.requesterId && order.status === 'PENDING_FUNDING' && (
              <Button 
                size="sm" 
                className="bg-green-500 hover:bg-green-500/80 text-white"
                onClick={async () => {
                  await tonConnectUI.sendTransaction({
                    validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
                    messages: [{
                      address: order.escrowAddress!,
                      amount: order.budgetNanoTon,
                    }],
                  });
                }}
              >
                {t('order.fund')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
