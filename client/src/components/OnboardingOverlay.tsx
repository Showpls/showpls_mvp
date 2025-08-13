import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { X, ArrowRight, CheckCircle, Wallet, MessageSquare, Camera, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  action?: () => void;
}

interface OnboardingOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onComplete: () => void;
  onSampleOrder: () => void;
  currentStep?: string;
}

export function OnboardingOverlay({
  isVisible,
  onClose,
  onComplete,
  onSampleOrder,
  currentStep = "welcome"
}: OnboardingOverlayProps) {
  const { t } = useTranslation();
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: t('onboarding.welcome.title'),
      description: t('onboarding.welcome.description'),
      icon: Star,
      completed: false,
    },
    {
      id: 'wallet_connect',
      title: t('onboarding.wallet.title'),
      description: t('onboarding.wallet.description'),
      icon: Wallet,
      completed: false,
    },
    {
      id: 'first_order',
      title: t('onboarding.order.title'),
      description: t('onboarding.order.description'),
      icon: Camera,
      completed: false,
      action: onSampleOrder,
    },
    {
      id: 'chat_system',
      title: t('onboarding.chat.title'),
      description: t('onboarding.chat.description'),
      icon: MessageSquare,
      completed: false,
    },
  ];

  const currentStepData = steps[activeStepIndex];
  const progress = ((activeStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    if (activeStepIndex < steps.length - 1) {
      setActiveStepIndex(activeStepIndex + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleStepAction = () => {
    if (currentStepData.action) {
      currentStepData.action();
    } else {
      handleNext();
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md"
        >
          <Card className="glass-panel border-border/50">
            <CardContent className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {t('onboarding.step')} {activeStepIndex + 1}/{steps.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="h-8 w-8 p-0 text-text-muted hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Progress Bar */}
              <Progress value={progress} className="h-2" />

              {/* Step Content */}
              <div className="space-y-4 text-center">
                <div className="mx-auto w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center">
                  <currentStepData.icon className="w-8 h-8 text-brand-primary" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-text-primary">
                    {currentStepData.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {currentStepData.description}
                  </p>
                </div>

                {/* Special content for specific steps */}
                {currentStepData.id === 'first_order' && (
                  <div className="bg-bg-secondary/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-brand-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>{t('onboarding.sampleOrder.benefits')}</span>
                    </div>
                    <ul className="text-xs text-text-muted space-y-1 text-left">
                      <li>• {t('onboarding.sampleOrder.benefit1')}</li>
                      <li>• {t('onboarding.sampleOrder.benefit2')}</li>
                      <li>• {t('onboarding.sampleOrder.benefit3')}</li>
                    </ul>
                  </div>
                )}

                {currentStepData.id === 'wallet_connect' && (
                  <div className="bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 rounded-lg p-4">
                    <div className="text-sm text-text-primary font-medium mb-2">
                      {t('onboarding.wallet.why')}
                    </div>
                    <div className="text-xs text-text-muted">
                      {t('onboarding.wallet.security')}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1"
                >
                  {t('common.skip')}
                </Button>

                <Button
                  onClick={handleStepAction}
                  className="flex-1 bg-brand-primary hover:bg-brand-primary/90"
                >
                  {currentStepData.id === 'first_order' 
                    ? t('onboarding.tryDemo')
                    : activeStepIndex === steps.length - 1
                    ? t('onboarding.getStarted')
                    : t('common.next')
                  }
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Step Indicators */}
              <div className="flex justify-center gap-2">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveStepIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === activeStepIndex
                        ? 'bg-brand-primary scale-125'
                        : index < activeStepIndex
                        ? 'bg-brand-primary/50'
                        : 'bg-bg-secondary'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}