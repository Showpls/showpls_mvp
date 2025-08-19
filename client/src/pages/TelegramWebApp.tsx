import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WalletConnect } from "@/components/WalletConnect";
// import { CreateRequestForm } from "@/components/CreateRequestForm";
import { MapView } from "@/components/MapView";
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
  Sun,
  Moon,
  MessageSquare
} from "lucide-react";
import { bootstrapTelegramAuth, getAuthToken } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
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

  const formatTON = (nanoTon: string | number): string => {
    const ton = Number(nanoTon) / 1e9;
    return `${ton.toLocaleString()} TON`;
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

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
    // Sync onboarding state when currentUser loads/changes
    setOnboarding({
      isProvider: currentUser?.isProvider ?? false,
      location: (currentUser as any)?.location ?? null,
    });
  }, [currentUser?.isProvider, (currentUser as any)?.location]);

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-card border-brand-primary/30 w-9 h-9 p-2">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-card border-brand-primary/30 text-foreground">
                <DropdownMenuLabel>{t('twa.settings')}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-brand-primary/20" />
                <div className="p-2">
                  <LanguageSwitcher />
                </div>
                <DropdownMenuSeparator className="bg-brand-primary/20" />
                <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                  {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  <span>{theme === 'dark' ? t('twa.lightMode') : t('twa.darkMode')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-brand-primary/20" />
                <DropdownMenuItem onClick={toggleProvider} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>{(currentUser?.isProvider ? t('twa.switchToBuyer') : t('twa.switchToProvider')) as any}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={setLocationFromDevice} className="cursor-pointer">
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>{t('twa.updateLocationFromDevice') as any}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Onboarding Banner */}
      {currentUser && (currentUser as any).onboardingCompleted === false && (
        <div className="max-w-sm mx-auto px-4 mb-4">
          <Card className="glass-panel border-brand-primary/30">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">{t('twa.welcome') as any}</h3>
              <div className="text-sm text-text-muted">{t('twa.completeOnboarding') as any}</div>
              <div className="flex items-center justify-between p-2 rounded-md bg-panel/60">
                <span className="text-sm">{onboarding.isProvider ? (t('twa.roleProvider') as any) : (t('twa.roleBuyer') as any)}</span>
                <Button size="sm" variant="outline" onClick={() => setOnboarding(o => ({ ...o, isProvider: !o.isProvider }))}>
                  {(t('twa.toggleRole') as any)}
                </Button>
              </div>
              <div className="space-y-2">
                <div className="text-sm">
                  {onboarding.location ? (
                    <span>{t('twa.locationSet') as any}: {onboarding.location.lat.toFixed(4)}, {onboarding.location.lng.toFixed(4)}</span>
                  ) : (
                    <span>{t('twa.locationNotSet') as any}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={async () => {
                    const loc = await getDeviceLocation();
                    if (loc) setOnboarding(o => ({ ...o, location: loc }));
                  }}>
                    <MapPin className="w-4 h-4 mr-2" />{t('twa.useDeviceLocation') as any}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setOnboarding(o => ({ ...o, location: null }))}>
                    {t('twa.clearLocation') as any}
                  </Button>
                </div>
              </div>
              <Button disabled={saving} onClick={completeOnboarding} className="w-full">
                {saving ? (t('twa.saving') as any) : (t('twa.saveAndContinue') as any)}
              </Button>
            </CardContent>
          </Card>
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

        {/* Profile Section */}
        {currentUser && (
          <Card className="glass-panel border-brand-primary/20">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <User className="w-5 h-5 text-brand-primary mr-2" />
                {t('twa.profile') as any}
              </h3>
              <div className="space-y-1 text-sm">
                <div><span className="text-text-muted">{t('twa.username') as any}:</span> @{(currentUser as any).username || '-'}</div>
                <div><span className="text-text-muted">{t('twa.role') as any}:</span> {(currentUser as any).isProvider ? (t('twa.provider') as any) : (t('twa.buyer') as any)}</div>
                <div><span className="text-text-muted">{t('twa.rating') as any}:</span> {(currentUser as any).rating ?? '-'}</div>
                <div><span className="text-text-muted">{t('twa.totalOrders') as any}:</span> {(currentUser as any).totalOrders ?? 0}</div>
                <div><span className="text-text-muted">{t('twa.location') as any}:</span> {(currentUser as any).location ? `${(currentUser as any).location.lat.toFixed(4)}, ${(currentUser as any).location.lng.toFixed(4)}` : '-'}</div>
              </div>
            </CardContent>
          </Card>
        )}
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
