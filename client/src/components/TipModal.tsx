import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Coins, Star, Gift } from "lucide-react";

interface TipModalProps {
  orderId: string;
  providerId: string;
  providerName: string;
  children: React.ReactNode;
  onTipSent?: () => void;
}

export function TipModal({ orderId, providerId, providerName, children, onTipSent }: TipModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState("0.1"); // TON
  const [message, setMessage] = useState('');

  const sendTip = useMutation({
    mutationFn: async (data: { amount: string, message?: string }) => {
      const nanoTon = (parseFloat(data.amount) * 1e9).toString();
      
      const response = await fetch(`/api/orders/${orderId}/tip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountNanoTon: nanoTon,
          message: data.message || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send tip');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId] });
      setIsOpen(false);
      setTipAmount("0.1");
      setMessage('');
      onTipSent?.();
    },
  });

  const handleSendTip = () => {
    if (!tipAmount || parseFloat(tipAmount) <= 0) return;
    sendTip.mutate({ amount: tipAmount, message });
  };

  const quickAmounts = ['0.1', '0.25', '0.5', '1.0'];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400" />
            {t('tip.sendTip')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Provider Info */}
          <Card className="bg-bg-secondary/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">{providerName}</p>
                  <p className="text-sm text-text-muted">{t('tip.forExcellentService')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Amount Buttons */}
          <div>
            <Label className="text-sm font-medium text-text-primary mb-2 block">
              {t('tip.quickAmounts')}
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant={tipAmount === amount ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTipAmount(amount)}
                  className="text-xs"
                >
                  {amount} TON
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <Label htmlFor="tipAmount" className="text-sm font-medium text-text-primary">
              {t('tip.customAmount')}
            </Label>
            <div className="relative">
              <Input
                id="tipAmount"
                type="number"
                step="0.01"
                min="0.01"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                placeholder="0.10"
                className="pr-12"
              />
              <Badge variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">
                TON
              </Badge>
            </div>
          </div>

          {/* Optional Message */}
          <div className="space-y-2">
            <Label htmlFor="tipMessage" className="text-sm font-medium text-text-primary">
              {t('tip.message')} ({t('common.optional')})
            </Label>
            <Textarea
              id="tipMessage"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('tip.messagePlaceholder')}
              className="min-h-[60px] resize-none"
              maxLength={200}
            />
            <div className="text-xs text-text-muted text-right">
              {message.length}/200
            </div>
          </div>

          {/* Total Display */}
          <Card className="bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">{t('tip.total')}</span>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-brand-primary" />
                  <span className="font-semibold text-lg text-text-primary">
                    {parseFloat(tipAmount || "0").toFixed(2)} TON
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSendTip}
              disabled={sendTip.isPending || !tipAmount || parseFloat(tipAmount) <= 0}
              className="flex-1 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90"
            >
              {sendTip.isPending ? (
                t('tip.sending')
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  {t('tip.send')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}