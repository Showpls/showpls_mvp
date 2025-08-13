import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OnboardingOverlay } from "./OnboardingOverlay";
import { OrderTemplates } from "./OrderTemplates";
import { PaymentCalculator } from "./PaymentCalculator";
import { QuickReplies } from "./QuickReplies";
import { TipModal } from "./TipModal";
import { useTranslation } from "react-i18next";
import { 
  Sparkles, 
  Calculator, 
  Clock, 
  Heart, 
  FileText,
  Zap
} from "lucide-react";

export function DemoButton() {
  const { t } = useTranslation();
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const demos = [
    {
      id: 'onboarding',
      name: 'Онбординг',
      description: 'Процесс знакомства с приложением',
      icon: Sparkles,
      color: 'bg-purple-500'
    },
    {
      id: 'templates',
      name: 'Шаблоны заказов',
      description: 'Готовые шаблоны для быстрого создания',
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      id: 'calculator',
      name: 'Калькулятор платежей',
      description: 'Расчет стоимости с комиссиями',
      icon: Calculator,
      color: 'bg-green-500'
    },
    {
      id: 'quick-replies',
      name: 'Быстрые реплики',
      description: 'Готовые ответы для чата',
      icon: Clock,
      color: 'bg-orange-500'
    },
    {
      id: 'tip-modal',
      name: 'Система чаевых',
      description: 'Отправка чаевых исполнителю',
      icon: Heart,
      color: 'bg-pink-500'
    }
  ];

  const closeDemo = () => setActiveDemo(null);

  return (
    <div className="fixed bottom-4 right-4 z-40" style={{ zIndex: 1000 }}>
      {!activeDemo && (
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl w-80 max-h-96 overflow-hidden">
          <CardHeader className="pb-2 p-4">
            <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
              <Zap className="w-5 h-5 text-purple-500" />
              Демо новых функций
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Протестируйте все MVP улучшения
            </p>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {demos.map((demo) => {
              const IconComponent = demo.icon;
              return (
                <button
                  key={demo.id}
                  onClick={() => {
                    console.log(`Демо кликнуто: ${demo.id}`);
                    setActiveDemo(demo.id);
                  }}
                  className="w-full justify-start h-auto p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer border-none bg-transparent text-left flex items-center"
                >
                  <div className={`w-2 h-2 rounded-full ${demo.color} mr-3 flex-shrink-0`} />
                  <IconComponent className="w-4 h-4 mr-3 text-gray-500" />
                  <div className="text-left flex-1">
                    <div className="font-medium text-sm text-gray-900 dark:text-white">
                      {demo.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {demo.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Onboarding Demo */}
      {activeDemo === 'onboarding' && (
        <OnboardingOverlay
          isVisible={true}
          onClose={closeDemo}
          onComplete={closeDemo}
          onSampleOrder={() => {
            console.log('Sample order demo');
            closeDemo();
          }}
        />
      )}

      {/* Templates Demo */}
      {activeDemo === 'templates' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <Card className="glass-panel">
              <CardContent className="p-4">
                <div className="mb-4 text-center">
                  <Badge variant="outline" className="mb-2">Демо</Badge>
                  <h3 className="font-semibold">Шаблоны заказов</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Продукт в магазине', category: 'товар', price: '0.1-0.5 TON' },
                    { name: 'Квартира изнутри', category: 'недвижимость', price: '0.5-2.0 TON' },
                    { name: 'Концерт прямой эфир', category: 'мероприятие', price: '1.0-5.0 TON' }
                  ].map((template, i) => (
                    <Card key={i} className="border-border/50 hover:bg-bg-secondary/30 cursor-pointer">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{template.name}</div>
                            <div className="text-xs text-text-muted">{template.category}</div>
                          </div>
                          <div className="text-xs text-brand-primary">{template.price}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Button onClick={closeDemo} className="w-full mt-4" variant="outline">
                  Закрыть
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Calculator Demo */}
      {activeDemo === 'calculator' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <PaymentCalculator 
              showTipOption={true}
              onCalculationChange={(calc) => console.log('Payment:', calc)}
            />
            <Button onClick={closeDemo} className="w-full mt-4" variant="outline">
              Закрыть
            </Button>
          </div>
        </div>
      )}

      {/* Quick Replies Demo */}
      {activeDemo === 'quick-replies' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <QuickReplies 
              onReplySelect={(msg) => console.log('Reply:', msg)}
              orderStatus="IN_PROGRESS"
            />
            <Button onClick={closeDemo} className="w-full mt-4" variant="outline">
              Закрыть
            </Button>
          </div>
        </div>
      )}

      {/* Tip Modal Demo */}
      {activeDemo === 'tip-modal' && (
        <TipModal
          orderId="demo-order"
          providerId="demo-provider"
          providerName="Демо исполнитель"
          onTipSent={() => console.log('Tip sent')}
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="glass-panel w-full max-w-sm">
              <CardContent className="p-6 text-center">
                <Heart className="w-12 h-12 text-pink-400 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Система чаевых</h3>
                <p className="text-sm text-text-muted mb-4">
                  Нажмите на кнопку чтобы открыть модальное окно для отправки чаевых
                </p>
                <Button className="mb-2" variant="outline">
                  <Heart className="w-4 h-4 mr-2" />
                  Отправить чаевые
                </Button>
                <br />
                <Button onClick={closeDemo} size="sm" variant="ghost">
                  Закрыть
                </Button>
              </CardContent>
            </Card>
          </div>
        </TipModal>
      )}
    </div>
  );
}