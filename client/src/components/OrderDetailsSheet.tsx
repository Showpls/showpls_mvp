import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from './ui/sheet';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Order } from '@shared/schema';
import { Chat } from './Chat';
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

export const OrderDetailsSheet: React.FC<OrderDetailsSheetProps> = ({ order, isOpen, onOpenChange }) => {
  const { currentUser } = useCurrentUser();
  const { t } = useTranslation();

  if (!order) return null;

  const canAccessChat = currentUser && (currentUser.id === order.requesterId || currentUser.id === order.providerId);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col bg-slate-900 text-white border-l-slate-800">
        <SheetHeader className="p-6 relative">
          <SheetTitle className="pr-10">{order.title}</SheetTitle>
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/10" onClick={() => onOpenChange(false)}>
            <X size={20} />
          </Button>
          <SheetDescription>{order.description}</SheetDescription>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400">{t('orderDetails.budget')}</p>
              <p className="font-semibold">{formatTON(order.budgetNanoTon)}</p>
            </div>
            <div>
              <p className="text-slate-400">{t('orderDetails.mediaType')}</p>
              <p className="font-semibold capitalize">{order.mediaType}</p>
            </div>
            <div>
              <p className="text-slate-400">{t('orderDetails.status')}</p>
              <p className="font-semibold capitalize">{order.status.toLowerCase().replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-slate-400">{t('orderDetails.location')}</p>
              <p className="font-semibold">{order.location.address || t('orderDetails.addressNotAvailable')}</p>
            </div>
          </div>
          {canAccessChat ? (
            <Chat orderId={order.id} />
          ) : (
            <div className="text-center text-slate-400 p-8 bg-slate-800 rounded-lg">
              <p>{t('orderDetails.acceptOrderToChat')}</p>
            </div>
          )}
        </div>
        <SheetFooter className="p-6 bg-slate-900 border-t border-slate-800">
          <OrderAcceptButton orderId={order.id} orderStatus={order.status} requesterId={order.requesterId} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};