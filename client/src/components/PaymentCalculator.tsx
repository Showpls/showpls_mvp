import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import { Calculator, Info, Coins, ArrowRight } from "lucide-react";

interface PaymentCalculatorProps {
  initialAmount?: string;
  platformFeeBps?: number;
  onCalculationChange?: (calculation: PaymentBreakdown) => void;
  showTipOption?: boolean;
  className?: string;
}

export interface PaymentBreakdown {
  budgetNanoTon: string;
  platformFeeNanoTon: string;
  providerReceivesNanoTon: string;
  tipNanoTon?: string;
  totalPayerNanoTon: string;
  milestones?: {
    atLocation: string;
    draftContent: string;
    final: string;
  };
}

export function PaymentCalculator({ 
  initialAmount = "1000000000", // 1 TON in nanoTON
  platformFeeBps = 250, // 2.5%
  onCalculationChange,
  showTipOption = false,
  className = ""
}: PaymentCalculatorProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(initialAmount);
  const [tip, setTip] = useState("0");
  const [showMilestones, setShowMilestones] = useState(false);

  const calculatePayment = (): PaymentBreakdown => {
    const budgetNano = BigInt(amount || "0");
    const tipNano = BigInt(tip || "0");
    const platformFeeNano = (budgetNano * BigInt(platformFeeBps)) / BigInt(10000);
    const providerReceivesNano = budgetNano - platformFeeNano;
    const totalPayerNano = budgetNano + tipNano;

    const milestones = showMilestones ? {
      atLocation: (budgetNano / BigInt(3)).toString(),
      draftContent: (budgetNano / BigInt(3)).toString(),
      final: (budgetNano - (budgetNano / BigInt(3)) - (budgetNano / BigInt(3))).toString(),
    } : undefined;

    return {
      budgetNanoTon: budgetNano.toString(),
      platformFeeNanoTon: platformFeeNano.toString(),
      providerReceivesNanoTon: providerReceivesNano.toString(),
      tipNanoTon: tipNano > 0 ? tipNano.toString() : undefined,
      totalPayerNanoTon: totalPayerNano.toString(),
      milestones
    };
  };

  const formatTON = (nanoTon: string): string => {
    const ton = Number(nanoTon) / 1e9;
    return ton.toFixed(4);
  };

  const calculation = calculatePayment();

  useEffect(() => {
    onCalculationChange?.(calculation);
  }, [amount, tip, showMilestones, onCalculationChange]);

  return (
    <Card className={`glass-panel ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5 text-brand-primary" />
          {t('payment.calculator')}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Budget Input */}
        <div className="space-y-2">
          <Label htmlFor="budget" className="text-sm font-medium text-text-primary">
            {t('payment.budget')}
          </Label>
          <div className="relative">
            <Input
              id="budget"
              value={formatTON(amount)}
              onChange={(e) => {
                const tonValue = parseFloat(e.target.value || "0");
                const nanoValue = Math.floor(tonValue * 1e9);
                setAmount(nanoValue.toString());
              }}
              placeholder="1.0000"
              className="pr-12"
            />
            <Badge variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">
              TON
            </Badge>
          </div>
        </div>

        {/* Tip Input (if enabled) */}
        {showTipOption && (
          <div className="space-y-2">
            <Label htmlFor="tip" className="text-sm font-medium text-text-primary">
              {t('payment.tip')} ({t('payment.optional')})
            </Label>
            <div className="relative">
              <Input
                id="tip"
                value={formatTON(tip)}
                onChange={(e) => {
                  const tonValue = parseFloat(e.target.value || "0");
                  const nanoValue = Math.floor(tonValue * 1e9);
                  setTip(nanoValue.toString());
                }}
                placeholder="0.0000"
                className="pr-12"
              />
              <Badge variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">
                TON
              </Badge>
            </div>
          </div>
        )}

        {/* Milestone Toggle */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-text-primary">
            {t('payment.milestonePayments')}
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMilestones(!showMilestones)}
            className="text-xs"
          >
            {showMilestones ? t('common.disable') : t('common.enable')}
          </Button>
        </div>

        <Separator />

        {/* Payment Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium text-text-primary flex items-center gap-2">
            <Info className="w-4 h-4 text-brand-primary" />
            {t('payment.breakdown')}
          </h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-text-muted">{t('payment.youPay')}</span>
              <span className="font-medium text-text-primary">
                {formatTON(calculation.budgetNanoTon)} TON
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-text-muted">
                {t('payment.platformFee')} ({(platformFeeBps / 100)}%)
              </span>
              <span className="text-red-400">
                -{formatTON(calculation.platformFeeNanoTon)} TON
              </span>
            </div>

            <div className="flex justify-between items-center font-medium">
              <span className="text-text-primary">{t('payment.providerReceives')}</span>
              <span className="text-green-400">
                {formatTON(calculation.providerReceivesNanoTon)} TON
              </span>
            </div>

            {calculation.tipNanoTon && (
              <div className="flex justify-between items-center">
                <span className="text-text-muted">{t('payment.tip')}</span>
                <span className="text-brand-primary">
                  +{formatTON(calculation.tipNanoTon)} TON
                </span>
              </div>
            )}

            <Separator className="my-2" />

            <div className="flex justify-between items-center font-bold text-lg">
              <span className="text-text-primary">{t('payment.total')}</span>
              <span className="text-brand-primary">
                {formatTON(calculation.totalPayerNanoTon)} TON
              </span>
            </div>
          </div>

          {/* Milestone Breakdown */}
          {showMilestones && calculation.milestones && (
            <div className="mt-4 p-3 bg-bg-secondary rounded-lg">
              <h5 className="font-medium text-sm text-text-primary mb-2">
                {t('payment.milestoneBreakdown')}
              </h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">{t('payment.atLocation')}</span>
                  <span>{formatTON(calculation.milestones.atLocation)} TON</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">{t('payment.draftContent')}</span>
                  <span>{formatTON(calculation.milestones.draftContent)} TON</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">{t('payment.finalDelivery')}</span>
                  <span>{formatTON(calculation.milestones.final)} TON</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {['0.5', '1.0', '2.5', '5.0'].map((tonAmount) => {
            const nanoAmount = (parseFloat(tonAmount) * 1e9).toString();
            return (
              <Button
                key={tonAmount}
                variant="outline"
                size="sm"
                onClick={() => setAmount(nanoAmount)}
                className="text-xs"
              >
                {tonAmount} TON
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}