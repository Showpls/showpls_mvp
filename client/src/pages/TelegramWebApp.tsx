import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WalletConnect } from "@/components/WalletConnect";
import { MapView } from "@/components/MapView";
import { LocationPicker } from "@/components/LocationPicker";
import { OrderCard } from "@/components/OrderCard";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
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

// Main component that handles client-side only rendering
export default function TelegramWebApp() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything during server-side rendering
  if (!isMounted) {
    return null;
  }

  return <TelegramWebAppContent />;
}

// Client-side only component
function TelegramWebAppContent() {
  const { t, i18n } = useTranslation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAllMyOrders, setShowAllMyOrders] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState<string>('');
  const { theme, setTheme } = useTheme();
  const { currentUser, isLoading, error } = useCurrentUser();
  const queryClient = useQueryClient();
  const [onboarding, setOnboarding] = useState({
    isProvider: false,
    location: null as null | { lat: number; lng: number; address?: string },
  });
  const [saving, setSaving] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [onboardingInitialized, setOnboardingInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);

  const formatTON = (nanoTon: string | number): string => {
    const ton = Number(nanoTon) / 1e9;
    return `${ton.toLocaleString()} TON`;
  };

  useEffect(() => {
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
    if (error) {
      console.error("Error fetching current user:", error);
      setHasError(true);
    }
  }, [error]);



  // Initialize onboarding after currentUser loads
  useEffect(() => {
    if (currentUser && !onboardingInitialized) {
      setOnboarding({
        isProvider: currentUser.isProvider ?? false,
        location: (currentUser as any)?.location ?? null,
      });
      setOnboardingInitialized(true);
    }
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

  const handleCreateRequest = () => {
    if (currentUser?.isProvider) {
      window.alert('You must be seller in order to create orders. Change that in settings');
      return
    }
    window.location.href = '/create-order';
  }
  const handleMapFilter = (mediaType: string) => setSelectedMediaType(mediaType);

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'photo': return <Camera className="w-5 h-5 text-brand-primary" />;
      case 'video': return <Video className="w-5 h-5 text-brand-accent" />;
      case 'live': return <Radio className="w-5 h-5 text-green-500" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show error state if something went wrong
  if (hasError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-center">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            Unable to load user data. Please try refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="glass-panel rounded-none h-16 mb-6">
        <div className="max-w-sm mx-auto flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-1">
            <img src="/logo4.png" alt="Showpls" className="block max-h-10 h-full object-contain mr-2 select-none" />
            <h2 className="text-foreground text-lg font-semibold tracking-wide select-none">SHOW<span className="text-blue-400 dark:text-blue-300">PLS</span></h2>
          </div>
          <div className="flex items-center space-x-2">
            <WalletConnect />
            <Button
              variant="outline"
              size="sm"
              className="border-brand-primary/30 p-2"
              onClick={() => {
                if (currentUser?.id) {
                  window.location.href = `/profile/${currentUser?.id}`;
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
          <div className="w-full max-w-md bg-[#fffff0] dark:bg-panel rounded-xl border border-brand-primary/30 shadow-xl">
            <div className="p-4 space-y-4">
              <h3 className="font-semibold text-lg text-foreground">{String(t('twa.welcome') || 'Welcome to Showpls')}</h3>
              <div className="text-sm text-muted font-medium">{String(t('twa.completeOnboarding') || 'Please choose your role and set your location to continue.')}</div>

              <div className="space-y-2">
                <div className="text-xs text-muted">{String(t('twa.chooseRole') || 'Choose your role')}:</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    aria-pressed={!onboarding.isProvider}
                    className={`justify-center gap-2 font-medium border transition-none ${!onboarding.isProvider ? 'bg-brand-primary text-white border-brand-primary' : 'bg-[#fffff0] dark:bg-panel border-brand-primary/30'}`}
                    onClick={() => setOnboarding(o => ({ ...o, isProvider: false }))}
                  >
                    <ShoppingBag className="w-4 h-4" /> {String(t('twa.roleBuyer') || 'Buyer')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    aria-pressed={onboarding.isProvider}
                    className={`justify-center gap-2 border font-medium transition-none ${onboarding.isProvider ? 'bg-brand-primary text-white border-brand-primary' : 'bg-[#fffff0] dark:bg-panel border-brand-primary/30'}`}
                    onClick={() => setOnboarding(o => ({ ...o, isProvider: true }))}
                  >
                    <Camera className="w-4 h-4" /> {String(t('twa.roleProvider') || 'Seller')}
                  </Button>
                </div>
                <div className="text-[11px] text-muted">{onboarding.isProvider ? String(t('twa.roleProviderHint') || 'You will fulfill requests and earn TON') : String(t('twa.roleBuyerHint') || 'You will create requests and pay in TON')}</div>
              </div>

              {onboarding.isProvider && (
                <div className="space-y-2">
                  <div className="text-xs text-muted">{String(t('twa.setLocation') || 'Set your location')}:</div>
                  {onboarding.location ? (
                    <div className="py-2 rounded-md text-sm">
                      <div className="font-medium text-foreground">{onboarding.location.address || `${onboarding.location.lat.toFixed(4)}, ${onboarding.location.lng.toFixed(4)}`}</div>
                      <div className="text-muted text-xs">{onboarding.location.lat.toFixed(4)}, {onboarding.location.lng.toFixed(4)}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted">{String(t('twa.locationNotSet') || 'No location selected')}</div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="default" className="w-full justify-center bg-brand-primary text-white" onClick={() => setShowLocationPicker(true)}>
                      <MapPin className="w-4 h-4 mr-2" /> {String(t('twa.pickOnMap') || 'Pick on map')}
                    </Button>
                  </div>
                </div>
              )}

              <Button
                disabled={saving || (!onboarding.location && onboarding.isProvider)}
                onClick={completeOnboarding}
                className="w-full bg-brand-primary text-white mt-3"
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
      <div className="max-w-sm mx-auto px-4 space-y-6 pb-10">

        {/* Create and Find request */}
        <div className="grid grid-cols-2 gap-4">
          <Card
            className="glass-panel border-brand-primary/20 hover:bg-brand-primary/10 transition-all cursor-pointer"
            onClick={handleCreateRequest}
          >
            <CardContent className="p-4 text-center">
              <Plus className="w-8 h-8 text-brand-primary mb-2 mx-auto" />
              <div className="font-medium text-foreground">{String(t('twa.createOrder'))}</div>
            </CardContent>
          </Card>

          <Card
            className="glass-panel border-brand-primary/20 hover:bg-brand-accent/10 transition-all cursor-pointer"
            onClick={() => window.location.href = '/map'}
          >
            <CardContent className="p-4 text-center">
              <MapPin className="w-8 h-8 text-brand-accent mb-2 mx-auto" />
              <div className="font-medium text-foreground">{String(t('twa.findRequests'))}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="glass-panel border-brand-primary/20">
          <CardContent className="p-3">
            <h3 className="font-semibold mb-2 flex items-center text-foreground text-sm">
              <Clock className="w-4 h-4 text-brand-primary mr-1" />
              {String(t('twa.recentActivity'))}
            </h3>
            <div className="space-y-2">
              {isLoadingRecent ? (
                <p className="text-muted font-medium text-xs">{t('twa.loadingActivity')}</p>
              ) : recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-2 bg-[#fffff0] dark:bg-panel/50 rounded">
                    <div className="flex items-center min-w-0">
                      <div className="w-6 h-6 bg-brand-primary/20 rounded-full flex items-center justify-center mr-2 text-xs">
                        {getMediaTypeIcon(order.mediaType)}
                      </div>
                      <div className="min-w-0 truncate">
                        <div className="font-medium text-xs truncate text-foreground">{order.title}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <div className="text-xs font-medium text-brand-accent">{formatTON(order.budgetNanoTon)}</div>
                      <div className="text-[11px] text-muted">
                        {formatDistanceToNow(new Date(order.createdAt), {
                          addSuffix: true,
                          locale: i18n.language === 'ru' ? ru : undefined
                        })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted font-medium text-xs">{t('twa.noRecentActivity')}</p>
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
                return (
                  <Card className="glass-panel border-brand-primary/20">
                    <CardContent className="p-4 text-center space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-full shadow-lg border border-brand-primary/30 bg-card flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-muted font-medium" />
                      </div>
                      <div className="text-sm text-muted font-medium">
                        {showAllMyOrders ? String(t('twa.noOrders') || 'You have no orders yet.') : String(t('twa.noActiveOrders') || 'You have no active orders.')}
                      </div>
                      <div className="flex gap-2 justify-center">
                        {currentUser?.isProvider ? (
                          <Button size="sm" className="bg-brand-primary text-background" onClick={() => window.location.href = '/map'}>
                            {String(t('twa.findRequests') || 'Find requests')}
                          </Button>
                        ) : (
                          <Button size="sm" className="bg-brand-primary text-white" onClick={handleCreateRequest}>
                            {String(t('twa.createOrder') || 'Create order')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <>
                  {ordersToShow.map((order: any) => (
                    <div key={order.id} className="relative mb-3 last:mb-0">
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
            <Card className="glass-panel border-brand-primary/20">
              <CardContent className="p-4 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full shadow-lg border border-brand-primary/30 bg-card flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-muted font-medium" />
                </div>
                <div className="text-sm text-muted font-medium">{String(t('twa.noOrders') || 'You have no orders yet.')}</div>
                <div className="flex gap-2 justify-center">
                  {currentUser?.isProvider ? (
                    <Button size="sm" variant="outline" onClick={() => window.location.href = '/map'}>
                      {String(t('twa.findRequests') || 'Find requests')}
                    </Button>
                  ) : (
                    <Button size="sm" className="bg-brand-primary text-background" onClick={handleCreateRequest}>
                      {String(t('twa.createOrder') || 'Create order')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
