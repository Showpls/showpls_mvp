import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WalletConnect } from "@/components/WalletConnect";
import { CreateRequestForm } from "@/components/CreateRequestForm";
import { MapView } from "@/components/MapView";
import { OrderCard } from "@/components/OrderCard";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Eye,
  Plus,
  MapPin,
  Clock,
  Camera,
  Video,
  Radio,
  User,
  Star,
  Coins,
  MessageSquare
} from "lucide-react";
import { bootstrapTelegramAuth } from "@/lib/auth";

export default function TelegramWebApp() {
  const { t } = useTranslation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState<string>('');

  useEffect(() => {
    // Initialize Telegram Web App
    const initTelegramWebApp = async () => {
      try {
        // Check if Telegram WebApp is available
        const telegramWebApp = (window as any)?.Telegram?.WebApp;

        if (telegramWebApp) {
          console.log('[TWA] Telegram WebApp detected, initializing...');

          // Tell Telegram that the Web App is ready
          if (telegramWebApp.ready) {
            telegramWebApp.ready();
          }

          // Expand the Web App to full height
          if (telegramWebApp.expand) {
            telegramWebApp.expand();
          }

          console.log('[TWA] Telegram WebApp initialized successfully');
        } else {
          console.warn('[TWA] Telegram WebApp not available - make sure you\'re opening this in Telegram');
        }

        // Attempt authentication
        await bootstrapTelegramAuth();
      } catch (error) {
        console.error('[TWA] Error initializing Telegram WebApp:', error);
      }
    };

    initTelegramWebApp();
  }, []);

  const { data: user } = useQuery({
    queryKey: ['/api/me'],
    enabled: true,
  });

  const { data: userOrders } = useQuery({
    queryKey: ['/api/orders/user'],
    enabled: !!user,
  });

  const handleCreateRequest = () => {
    // Redirect to create order page
    window.location.href = '/create-order';
  };

  const handleMapFilter = (mediaType: string) => {
    setSelectedMediaType(mediaType);
  };

  const fillSampleRequest = () => {
    setShowCreateForm(true);
    // The CreateRequestForm component will handle sample data
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* TWA Header */}
      <div className="glass-panel p-4 mb-6">
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center mr-3">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Showpls</span>
          </div>
          <div className="flex items-center space-x-3">
            <WalletConnect />
            <Button variant="ghost" size="sm">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main TWA Content */}
      <div className="max-w-sm mx-auto px-4 space-y-6">

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card
            className="glass-panel border-brand-primary/20 hover:bg-brand-primary/10 transition-all cursor-pointer"
            onClick={handleCreateRequest}
          >
            <CardContent className="p-4 text-center">
              <Plus className="w-8 h-8 text-brand-primary mb-2 mx-auto" />
              <div className="font-medium">{String(t('twa.newRequest'))}</div>
              <div className="text-sm text-text-muted">{String(t('twa.createOrder'))}</div>
            </CardContent>
          </Card>
          <Card
            className="glass-panel border-brand-primary/20 hover:bg-brand-accent/10 transition-all cursor-pointer"
            onClick={() => window.location.href = '/map'}
          >
            <CardContent className="p-4 text-center">
              <MapPin className="w-8 h-8 text-brand-accent mb-2 mx-auto" />
              <div className="font-medium">{String(t('twa.nearby'))}</div>
              <div className="text-sm text-text-muted">{String(t('twa.findRequests'))}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="glass-panel border-brand-primary/20">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4 flex items-center">
              <Clock className="w-5 h-5 text-brand-primary mr-2" />
              {String(t('twa.recentActivity'))}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-panel/50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-brand-primary/20 rounded-full flex items-center justify-center mr-3">
                    <Camera className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{String(t('twa.sampleOrder1'))}</div>
                    <div className="text-xs text-text-muted flex items-center">
                      {String(t('twa.delivered'))} • <Star className="w-3 h-3 text-yellow-400 ml-1" /> 5.0
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-brand-accent">+2.5 TON</div>
                  <div className="text-xs text-text-muted">{String(t('twa.timeAgo.recent'))}</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-panel/50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-brand-accent/20 rounded-full flex items-center justify-center mr-3">
                    <Video className="w-5 h-5 text-brand-accent" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{String(t('twa.sampleOrder2'))}</div>
                    <div className="text-xs text-text-muted">{String(t('twa.inProgress'))}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-yellow-400">5.0 TON</div>
                  <div className="text-xs text-text-muted">{String(t('twa.timeAgo.hour'))}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!showCreateForm ? (
          <Card className="glass-panel border-brand-primary/20 overflow-hidden">
            <MapView
              selectedMediaType={selectedMediaType}
              onMediaTypeChange={handleMapFilter}
            />
          </Card>
        ) : null}

        {/* Create Request Form */}
        {showCreateForm ? (
          <CreateRequestForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false);
            }}
          />
        ) : null}

        {/* Sample Request Button */}
        <Card
          className="glass-panel border-brand-primary/20 hover:bg-brand-primary/10 transition-all cursor-pointer"
          onClick={fillSampleRequest}
        >
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-5 h-5 text-brand-primary inline mr-2" />
            <span className="font-medium">{String(t('twa.trySample'))}</span>
          </CardContent>
        </Card>

        {/* User Orders */}
        {userOrders && (userOrders as any).length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-semibold">{String(t('twa.yourOrders'))}</h3>
            {(userOrders as any).map((order: any) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
