import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WalletConnect } from "@/components/WalletConnect";
// import { CreateRequestForm } from "@/components/CreateRequestForm";
import { MapView } from "@/components/MapView";
import { LocationPicker } from "@/components/LocationPicker";
import { OrderCard } from "@/components/OrderCard";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Eye,
  Plus,
  MapPin,
  Clock,
  Camera,
  Video,
  Radio,
  User,
  MessageSquare,
  ShoppingBag
} from "lucide-react";
import { bootstrapTelegramAuth, getAuthToken } from "@/lib/auth";
// Settings moved to Profile page
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function TelegramWebApp() {
  const { t, i18n } = useTranslation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAllMyOrders, setShowAllMyOrders] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState<string>('');
  const { theme, setTheme } = useTheme();
  const { currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const [onboarding, setOnboarding] = useState({
    isProvider: currentUser?.isProvider ?? false,
    location: currentUser?.location ?? null as null | { lat: number; lng: number; address?: string },
  });
  const [saving, setSaving] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [onboardingInitialized, setOnboardingInitialized] = useState(false);

  const formatTON = (nanoTon: string | number): string => {
    const ton = Number(nanoTon) / 1e9;
    return `${ton.toLocaleString()} TON`;
  };

  // Theme toggle moved to Profile page

  useEffect(() => {
    // Initialize Telegram Web App
    const initTelegramWebApp = async () => {
      try {
        const telegramWebApp = (window as any)?.Telegram?.WebApp;
        if (telegramWebApp) {
          console.log('[TWA] Telegram WebApp detected, initializing...');
          if (telegramWebApp.ready) telegramWebApp.ready();
          if (telegramWebApp.expand) telegramWebApp.expand();
          console.log('[TWA] Telegram WebApp initialized successfully');
        } else {
          console.warn('[TWA] Telegram WebApp not available');
        }
        await bootstrapTelegramAuth();
      } catch (error) {
        console.error('[TWA] Error initializing Telegram WebApp:', error);
      }
    };
    initTelegramWebApp();
  }, []);

  useEffect(() => {
    // Initialize onboarding state once when currentUser becomes available to prevent UI glitches
    if (!currentUser || onboardingInitialized) return;
    setOnboarding({
      isProvider: currentUser?.isProvider ?? false,
      location: (currentUser as any)?.location ?? null,
    });
    setOnboardingInitialized(true);
  }, [currentUser, onboardingInitialized]);

  const getDeviceLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    if (!('geolocation' in navigator)) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  };

  const updateProfile = async (payload: any) => {
    const token = getAuthToken();
    const res = await fetch('/api/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    await res.json();
    await queryClient.invalidateQueries({ queryKey: ['/api/me'] });
  };

  const completeOnboarding = async () => {
    try {
      setSaving(true);
      await updateProfile({
        isProvider: onboarding.isProvider,
        location: onboarding.location,
        onboardingCompleted: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleProvider = async () => {
    await updateProfile({ isProvider: !(currentUser?.isProvider ?? false) });
  };

  const setLocationFromDevice = async () => {
    const loc = await getDeviceLocation();
    if (!loc) return;
    await updateProfile({ location: loc });
  };

  const setLocationFromDeviceLocal = async () => {
    const loc = await getDeviceLocation();
    if (!loc) return;
    setOnboarding(o => ({ ...o, location: loc }));
  };

  const { data: userOrders } = useQuery({
    queryKey: ['/api/orders/user'],
    enabled: !!currentUser,
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch('/api/orders/user', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Failed to fetch user orders');
      return response.json();
    },
  });

  const { data: recentOrders, isLoading: isLoadingRecent } = useQuery<any[]>({
    queryKey: ['/api/orders', { limit: 2, sort: 'desc' }],
    queryFn: async () => {
      const response = await fetch('/api/orders?limit=2&sort=desc');
      if (!response.ok) throw new Error('Failed to fetch recent orders');
      const data = await response.json();
      // Ensure we only return the last 2 orders, sorted by creation date descending
      const orders = Array.isArray(data.orders) ? data.orders : [];
      return orders
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2);
    },
  });

  const handleCreateRequest = () => window.location.href = '/create-order';
  const handleMapFilter = (mediaType: string) => setSelectedMediaType(mediaType);
  const fillSampleRequest = () => setShowCreateForm(true);

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'photo': return <Camera className="w-5 h-5 text-brand-primary" />;
      case 'video': return <Video className="w-5 h-5 text-brand-accent" />;
      case 'live': return <Radio className="w-5 h-5 text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="glass-panel p-4 mb-6">
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center mr-3">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Showpls</span>
          </div>
          <div className="flex items-center space-x-2">
            <WalletConnect />
            <Button
              variant="outline"
              size="sm"
              className="bg-card border-brand-primary/30 w-9 h-9 p-2"
              onClick={() => {
                if (currentUser?.id) {
                  window.location.href = `/profile/${currentUser.id}`;
                }
              }}
              title="Open Profile"
            >
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Onboarding Blocking Overlay */}
      {currentUser && (currentUser as any).onboardingCompleted === false && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-background rounded-xl border border-brand-primary/30 shadow-xl">
            <div className="p-4 space-y-4">
              <h3 className="font-semibold text-lg">{String(t('twa.welcome') || 'Welcome to Showpls')}</h3>
              <div className="text-sm text-text-muted">{String(t('twa.completeOnboarding') || 'Please choose your role and set your location to continue.')}</div>

              <div className="space-y-2">
                <div className="text-xs text-text-muted">{String(t('twa.chooseRole') || 'Choose your role')}:</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    aria-pressed={!onboarding.isProvider}
                    className={`justify-center gap-2 border transition-none ${!onboarding.isProvider ? 'bg-brand-primary text-white border-brand-primary' : 'bg-card border-brand-primary/30'}`}
                    onClick={() => setOnboarding(o => ({ ...o, isProvider: false }))}
                  >
                    <ShoppingBag className="w-4 h-4" /> {String(t('twa.roleBuyer') || 'Buyer')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    aria-pressed={onboarding.isProvider}
                    className={`justify-center gap-2 border transition-none ${onboarding.isProvider ? 'bg-brand-primary text-white border-brand-primary' : 'bg-card border-brand-primary/30'}`}
                    onClick={() => setOnboarding(o => ({ ...o, isProvider: true }))}
                  >
                    <Camera className="w-4 h-4" /> {String(t('twa.roleProvider') || 'Seller')}
                  </Button>
                </div>
                <div className="text-[11px] text-text-muted">{onboarding.isProvider ? String(t('twa.roleProviderHint') || 'You will fulfill requests and earn TON') : String(t('twa.roleBuyerHint') || 'You will create requests and pay in TON')}</div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-text-muted">{String(t('twa.setLocation') || 'Set your location')}:</div>
                {onboarding.location ? (
                  <div className="p-2 rounded-md bg-panel/60 text-sm">
                    <div className="font-medium">{onboarding.location.address || `${onboarding.location.lat.toFixed(4)}, ${onboarding.location.lng.toFixed(4)}`}</div>
                    <div className="text-text-muted text-xs">{onboarding.location.lat.toFixed(4)}, {onboarding.location.lng.toFixed(4)}</div>
                  </div>
                ) : (
                  <div className="text-sm text-text-muted">{String(t('twa.locationNotSet') || 'No location selected')}</div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="default" className="w-full justify-center bg-brand-primary text-white" onClick={() => setShowLocationPicker(true)}>
                    <MapPin className="w-4 h-4 mr-2" /> {String(t('twa.pickOnMap') || 'Pick on map')}
                  </Button>
                  {onboarding.location && (
                    <Button size="sm" variant="outline" onClick={() => setOnboarding(o => ({ ...o, location: null }))}>
                      {String(t('twa.clearLocation') || 'Clear')}
                    </Button>
                  )}
                </div>
              </div>

              <Button
                disabled={saving || !onboarding.location}
                onClick={completeOnboarding}
                className="w-full gradient-bg text-white mt-3"
              >
                {saving ? String(t('twa.saving') || 'Saving...') : String(t('twa.saveAndContinue') || 'Save and continue')}
              </Button>
            </div>
          </div>

          {showLocationPicker && (
            <LocationPicker
              initialLocation={onboarding.location || undefined}
              onLocationSelect={(loc) => {
                setOnboarding(o => ({ ...o, location: loc }));
              }}
              onClose={() => setShowLocationPicker(false)}
              hideCloseButton
            />
          )}
        </div>
      )}

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

        {/* Profile section removed; open profile from top-right button */}
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
              {isLoadingRecent ? (
                <p className="text-text-muted text-sm">{t('twa.loadingActivity')}</p>
              ) : recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-panel/50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-brand-primary/20 rounded-full flex items-center justify-center mr-3">
                        {getMediaTypeIcon(order.mediaType)}
                      </div>
                      <div>
                        <div className="font-medium text-sm truncate w-40">{order.title}</div>
                        <div className="text-xs text-text-muted capitalize">{order.status}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-brand-accent">+{formatTON(order.budgetNanoTon)}</div>
                      <div className="text-xs text-text-muted">
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: i18n.language === 'ru' ? ru : undefined })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-text-muted text-sm">{t('twa.noRecentActivity')}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {!showCreateForm ? (
          <Card className="glass-panel border-brand-primary/20 overflow-hidden">
            <MapView
              selectedMediaType={selectedMediaType}
              onMediaTypeChange={handleMapFilter}
              isClickable={false}
            />
          </Card>
        ) : null}

        {/* Create Request Form
        {showCreateForm ? (
          <CreateRequestForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false);
            }}
          />
        ) : null} */}

        {/* Sample Request Button - Commented out as per request
        <Card
          className="glass-panel border-brand-primary/20 hover:bg-brand-primary/10 transition-all cursor-pointer"
          onClick={fillSampleRequest}
        >
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-5 h-5 text-brand-primary inline mr-2" />
            <span className="font-medium">{String(t('twa.trySample'))}</span>
          </CardContent>
        </Card>
        */}

        {/* My Orders Section */}
        <div className="space-y-4">
          <h3 className="font-semibold">{showAllMyOrders ? String(t('twa.myOrders')) : String(t('twa.myActiveOrders'))}</h3>
          {userOrders && (userOrders as any).orders.length > 0 ? (
            (() => {
              const allOrders = (userOrders as any).orders;
              const activeStatuses = ['CREATED', 'PENDING_FUNDING', 'FUNDED', 'IN_PROGRESS', 'AT_LOCATION', 'DRAFT_CONTENT'];
              const activeOrders = allOrders.filter((order: any) => {
                const isMine = order.requesterId === currentUser?.id || order.providerId === currentUser?.id;
                if (!isMine) return false;
                if (!activeStatuses.includes(order.status)) return false;
                // Exclude own orders that have not been accepted by a provider yet
                if (order.requesterId === currentUser?.id && !order.providerId) return false;
                return true;
              });
              const ordersToShow = showAllMyOrders ? allOrders : activeOrders;

              if (ordersToShow.length === 0) {
                return <p className="text-text-muted text-sm">{showAllMyOrders ? t('twa.noOrders') : t('twa.noActiveOrders')}</p>;
              }

              return (
                <>
                  {ordersToShow.map((order: any) => (
                    <div key={order.id} className="relative">
                      <OrderCard order={order} />
                    </div>
                  ))}
                  <Button variant="link" onClick={() => setShowAllMyOrders(!showAllMyOrders)} className="text-brand-primary">
                    {showAllMyOrders ? t('twa.showActiveOrders') : t('twa.showAllOrders')}
                  </Button>
                </>
              );
            })()
          ) : (
            <p className="text-text-muted text-sm">{t('twa.noOrders')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
