import { useState, useEffect } from "react";
import { useTonWallet, useTonConnectUI } from "@tonconnect/ui-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Video, Smartphone, ArrowLeft, Map } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { getAuthToken, bootstrapTelegramAuth } from "@/lib/auth";
import { locationService } from "@/lib/location";
import { InteractiveMap } from "@/components/InteractiveMap";
import { LocationPicker } from "@/components/LocationPicker";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface OrderData {
  title: string;
  description: string;
  mediaType: 'photo' | 'video' | 'live';
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  budgetNanoTon: string;
  isSampleOrder: boolean;
}

export default function CreateOrder() {
  const [orderData, setOrderData] = useState<OrderData>({
    title: '',
    description: '',
    mediaType: 'photo',
    location: { lat: 55.7558, lng: 37.6176, address: 'Москва, Россия' },
    budgetNanoTon: '1000000000', // 1 TON in nano-TON
    isSampleOrder: false,
  });

  const { currentUser } = useCurrentUser()
  const [showMap, setShowMap] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  // Removed immediate escrow creation on order creation; funding occurs after provider accepts
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<{ sufficient: boolean; balance: string; required: string } | null>(null);
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const { t } = useTranslation();

  const queryClient = useQueryClient();

  useEffect(() => {
    // Ensure we have a token if user navigates directly here
    (async () => {
      if (!getAuthToken()) {
        await bootstrapTelegramAuth();
      }
    })();

    if (currentUser?.isProvider) {
      window.location.href = '/twa';
      return;
    }

    // Initialize location service
    const initLocation = async () => {
      try {
        await locationService.initialize();
        console.log('[CREATE_ORDER] Location service initialized successfully');
      } catch (err) {
        console.error('[CREATE_ORDER] Failed to initialize location service:', err);
      }
    };

    initLocation();

    // Cleanup on unmount
    return () => {
      locationService.destroy();
    };
  }, []);

  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderData) => {
      if (!wallet) {
        throw new Error(t('createOrder.walletNotConnected'));
      }

      const token = getAuthToken();
      // Step 1: Create Order in our backend
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Failed to create order. Status:', response.status, 'Body:', errorBody);
        try {
          const errorJson = JSON.parse(errorBody);
          throw new Error(errorJson.error || t('createOrder.failedToCreate'));
        } catch (e) {
          throw new Error(t('createOrder.failedToCreate'));
        }
      }

      const responseData = await response.json();
      if (!responseData.success || !responseData.order) {
        console.error('API response missing order:', responseData);
        throw new Error(t('createOrder.failedToCreate'));
      }
      const order = responseData.order as { id: string; status: string };
      console.log('Order created response:', order); // DEBUG

      return order;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/orders/user'] });
      // Redirect after successful funding & verification
      window.location.href = '/twa';
    },
    onError: (error) => {
      console.error('Order creation failed:', error);
      // no-op
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderData.title.trim() || !orderData.description.trim()) {
      alert(t('createOrder.fillTitleAndDescription'));
      return;
    }

    if (!getAuthToken()) {
      alert(t('createOrder.authRequired'));
      return;
    }

    // Require connected TON wallet
    if (!wallet) {
      try { tonConnectUI.openModal(); } catch { }
      return;
    }

    // Check balance against budget using backend (adds gas reserve)
    try {
      const res = await fetch('/api/ton/check-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
        },
        body: JSON.stringify({ requiredNano: orderData.budgetNanoTon })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Balance check failed');
      setBalanceInfo(json);
      if (!json.sufficient) {
        alert(t('createOrder.insufficientBalance', {
          balance: (Number(json.balance) / 1e9).toFixed(3),
          required: (Number(json.required) / 1e9).toFixed(3)
        }));
        return;
      }
    } catch (err: any) {
      alert(err.message || 'Failed to check balance');
      return;
    }

    // Open confirmation dialog
    setConfirmOpen(true);
  };

  // Removed direct browser current-location selection; use LocationPicker only

  const fillSampleData = () => {
    setOrderData({
      title: t('createOrder.sampleTitle'),
      description: t('createOrder.sampleDescription'),
      mediaType: 'photo',
      location: { lat: 55.7539, lng: 37.6208, address: t('createOrder.sampleAddress') },
      budgetNanoTon: '2500000000', // 2.5 TON
      isSampleOrder: true,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 text-foreground">
          <Link href="/twa">
            <Button variant="ghost" className="hover:bg-text-primary/10">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{t('createOrder.title')}</h1>
        </div>

        <Card className="glass-panel border-brand-primary/20">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Camera size={24} />
              {t('createOrder.newContentRequest')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6 font-medium">
              {/* Sample Data Button */}
              <Button
                type="button"
                variant="outline"
                onClick={fillSampleData}
                className="w-full text-md text-foreground font-medium bg-[#FFFFF0] dark:bg-panel/60"
              >
                {t('createOrder.fillSample')}
              </Button>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground">{t('createOrder.orderTitle')}</Label>
                <Input
                  id="title"
                  value={orderData.title}
                  onChange={(e) => setOrderData({ ...orderData, title: e.target.value })}
                  placeholder={t('createOrder.orderTitlePlaceholder')}
                  className="bg-[#FFFFF0] dark:bg-panel/60 border-brand-primary/30 text-muted placeholder:text-muted"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">{t('createOrder.description')}</Label>
                <Textarea
                  id="description"
                  value={orderData.description}
                  onChange={(e) => setOrderData({ ...orderData, description: e.target.value })}
                  placeholder={t('createOrder.descriptionPlaceholder')}
                  rows={4}
                  className="bg-[#FFFFF0] dark:bg-panel/60 border-brand-primary/30 text-muted placeholder:text-muted"
                />
              </div>

              {/* Media Type */}
              <div className="space-y-2">
                <Label className="text-foreground">{t('createOrder.contentType')}</Label>
                <Select
                  value={orderData.mediaType}
                  onValueChange={(value: 'photo' | 'video' | 'live') =>
                    setOrderData({ ...orderData, mediaType: value })
                  }
                >
                  <SelectTrigger className="bg-[#FFFFF0] dark:bg-panel/60 border-brand-primary/30 text-muted font-medium placeholder:text-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FFFFF0] dark:bg-panel border-brand-primary/30 text-muted font-medium placeholder:text-muted">
                    <SelectItem value="photo">
                      <div className="flex items-center gap-2">
                        <Camera size={16} />
                        {t('createOrder.photo')}
                      </div>
                    </SelectItem>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <Video size={16} />
                        {t('createOrder.video')}
                      </div>
                    </SelectItem>
                    <SelectItem value="live">
                      <div className="flex items-center gap-2">
                        <Smartphone size={16} />
                        {t('createOrder.liveStream')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label className="text-foreground">{t('createOrder.location')}</Label>
                <div className="flex gap-2">
                  <Input
                    value={orderData.location.address || t('createOrder.specifyAddress')}
                    onChange={(e) => setOrderData({
                      ...orderData,
                      location: { ...orderData.location, address: e.target.value }
                    })}
                    placeholder={t('createOrder.addressPlaceholder')}
                    className="bg-[#FFFFF0] dark:bg-panel/60 border-brand-primary/30 text-muted placeholder:text-muted"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowLocationPicker(true)}
                    className="shrink-0 text-foreground"
                  >
                    <Map size={16} />
                  </Button>
                </div>
                <div className="text-sm text-muted">
                  {t('createOrder.coordinates', { lat: orderData.location.lat.toFixed(4), lng: orderData.location.lng.toFixed(4) })}
                </div>
              </div>

              {/* Location Picker Modal */}
              {showLocationPicker && (
                <LocationPicker
                  initialLocation={orderData.location}
                  onLocationSelect={(location) => {
                    setOrderData({
                      ...orderData,
                      location: location
                    });
                    setShowLocationPicker(false);
                  }}
                  onClose={() => setShowLocationPicker(false)}
                  hideUseCurrentButton
                />
              )}

              {/* Interactive Map for nearby orders */}
              {showMap && (
                <div className="space-y-2">
                  <Label className="text-foreground">{t('createOrder.nearbyOrdersMap')}</Label>
                  <InteractiveMap
                    onOrderClick={(order) => {
                      console.log('Nearby order clicked:', order);
                      // Could show order details or use as reference
                    }}
                    initialCenter={[orderData.location.lng, orderData.location.lat]}
                    initialZoom={12}
                    className="h-80"
                  />
                </div>
              )}

              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-foreground">{t('createOrder.budget')}</Label>
                <Select
                  value={orderData.budgetNanoTon}
                  onValueChange={(value) => setOrderData({ ...orderData, budgetNanoTon: value })}
                >
                  <SelectTrigger className="bg-[#FFFFF0] dark:bg-panel/60 border-brand-primary/30 text-muted placeholder:text-muted font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FFFFF0] dark:bg-panel border-brand-primary/30 text-foreground">
                    <SelectItem value="1000000000">1 TON</SelectItem>
                    <SelectItem value="2500000000">2.5 TON</SelectItem>
                    <SelectItem value="5000000000">5 TON</SelectItem>
                    <SelectItem value="10000000000">10 TON</SelectItem>
                    <SelectItem value="25000000000">25 TON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-brand-primary text-white hover:bg-brand-primary/90"
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? t('createOrder.creating') : t('createOrder.createOrder')}
              </Button>

              {/* Confirmation Dialog (controlled) */}
              <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialog.Portal>
                  <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" />
                  <AlertDialog.Content className="glass-panel p-6 rounded-lg max-w-sm w-full">
                    <AlertDialog.Title className="font-semibold text-foreground mb-4 text-lg">
                      {t('createRequest.confirm.title')}
                    </AlertDialog.Title>
                    <AlertDialog.Description className="text-muted-foreground mb-6 text-sm leading-relaxed">
                      {t('createRequest.confirm.body')}
                    </AlertDialog.Description>
                    <div className="flex gap-2">
                      <AlertDialog.Cancel asChild>
                        <Button variant="outline" className="flex-1">{t('common.cancel')}</Button>
                      </AlertDialog.Cancel>
                      <AlertDialog.Action asChild>
                        <Button onClick={() => createOrderMutation.mutate(orderData)} className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white">
                          {t('createRequest.confirm.confirm')}
                        </Button>
                      </AlertDialog.Action>
                    </div>
                  </AlertDialog.Content>
                </AlertDialog.Portal>
              </AlertDialog.Root>

              {createOrderMutation.error && (
                <div className="text-red-400 text-sm">
                  {t('createOrder.errorPrefix', { message: createOrderMutation.error.message })}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}