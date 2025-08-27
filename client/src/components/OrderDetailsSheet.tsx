import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from './ui/sheet';
import { Card, CardContent } from './ui/card';
import { MapPin, Clock, Wallet, Camera, Video, Radio } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Order } from '@shared/schema';
import { OrderAcceptButton } from './OrderAcceptButton';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface OrderDetailsSheetProps {
  order: Order | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const formatTON = (nanoTon: string | number): string => {
  const ton = Number(nanoTon) / 1e9;
  return `${ton.toLocaleString()} TON`;
};

const getMediaTypeIcon = (type: string) => {
  switch (type) {
    case 'photo': return <Camera className="w-4 h-4" />;
    case 'video': return <Video className="w-4 h-4" />;
    case 'live': return <Radio className="w-4 h-4" />;
    default: return <Camera className="w-4 h-4" />;
  }
};

// Status badge removed; no status-specific styling in header

export const OrderDetailsSheet: React.FC<OrderDetailsSheetProps> = ({ order, isOpen, onOpenChange }) => {
  const { currentUser } = useCurrentUser();
  const { t } = useTranslation();

  if (!order) return null;


  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col bg-background text-foreground">
        {/* Header */}
        <SheetHeader className="p-6 border-b border-white/10 backdrop-blur-sm">
          <div className="flex items-start">
            <div className="flex-1 pr-0">
              <div className="flex items-center gap-3 mb-2">
                {getMediaTypeIcon(order.mediaType)}
                <SheetTitle className="text-xl font-bold text-foreground">{order.title}</SheetTitle>
              </div>
              <SheetDescription className="text-muted font-medium text-sm leading-relaxed">
                {order.description}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Order Details */}
          <div className="p-6 space-y-6">
            <Card className="glass-panel border-white/20 ">
              <CardContent className="p-4 space-y-4 font-medium">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-4 h-4 flex-shrink-0 text-blue-400" />
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wide">Budget</p>
                      <p className="font-semibold text-foreground">{formatTON(order.budgetNanoTon)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 flex-shrink-0 text-green-400" />
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wide">Created</p>
                      <p className="font-semibold text-foreground">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide">Location</p>
                    <p className="font-semibold text-foreground text-sm">
                      {order.location.address || `${order.location.lat.toFixed(4)}, ${order.location.lng.toFixed(4)}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="p-6 border-t border-white/10 backdrop-blur-sm">
          <div className="w-full">
            <OrderAcceptButton
              orderId={order.id}
              orderStatus={order.status}
              requesterId={order.requesterId}
              className="w-full"
            />
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};