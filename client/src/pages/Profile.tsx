import { useMemo, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingForm } from "@/components/RatingForm";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTheme } from "next-themes";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getAuthToken } from "@/lib/auth";
import { LocationPicker } from "@/components/LocationPicker";

interface PublicUserProfile {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  rating?: number;
  totalOrders?: number;
  isProvider?: boolean;
  location?: string | { lat: number; lng: number };
  photoUrl?: string;
}

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();
  const { currentUser } = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const { data, isLoading, isError } = useQuery<PublicUserProfile>({
    queryKey: ["/api/users", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`/api/users/${id}`);
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
  });

  const displayName = useMemo(() => {
    if (!data) return "";
    return data.firstName || data.username || t("chat.unknown");
  }, [data, t]);

  const initial = (displayName || "U").charAt(0).toUpperCase();

  const orderIdFromQuery = useMemo(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const params = new URLSearchParams(search);
    return params.get('orderId') || '';
  }, []);

  const isOwnProfile = currentUser?.id && data?.id && currentUser.id === data.id;

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
  };

  // Location selection handled via LocationPicker modal

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="glass-panel p-4 mb-6 sticky top-0 z-40">
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="mr-2" onClick={() => setLocation('/twa')}>
              ←
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-semibold text-sm">{initial}</span>
            </div>
            <div>
              <div className="font-semibold">{displayName}</div>
              {data?.username && (
                <div className="text-xs text-text-muted">@{data.username}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-4 pb-20 space-y-4">
        {isLoading && (
          <div className="text-center text-text-muted py-8">{t('profile.loading')}</div>
        )}
        {isError && (
          <div className="text-center text-red-400 py-8">{t('profile.failedToLoad') || 'Failed to load profile'}</div>
        )}
        {!isLoading && !isError && data && (
          <>
            <Card className="glass-panel border-brand-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-text-muted">{t('profile.rating')}</div>
                    <div className="text-xl font-semibold">{Number(data.rating ?? 0).toFixed(2)}</div>
                  </div>
                  {data.isProvider && (
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">{t('profile.provider')}</Badge>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="glass-panel p-3 rounded-md">
                    <div className="text-text-muted">{t('profile.totalOrders')}</div>
                    <div className="font-semibold">{data.totalOrders ?? 0}</div>
                  </div>
                  <div className="glass-panel p-3 rounded-md">
                    <div className="text-text-muted">{t('profile.location')}</div>
                    <div className="font-semibold">
                      {typeof data.location === 'string'
                        ? data.location
                        : data.location && typeof data.location === 'object'
                          ? `${Number((data.location as any).lat).toFixed(5)}, ${Number((data.location as any).lng).toFixed(5)}`
                          : t('profile.locationUnknown')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isOwnProfile && (
              <Card className="glass-panel border-brand-primary/20">
                <CardContent className="p-4 space-y-3">
                  <div className="font-semibold mb-1">{t('profile.settings')}</div>
                  <div className="flex items-center justify-between p-2 rounded-md bg-panel/50">
                    <div className="text-sm">{t('profile.language')}</div>
                    <LanguageSwitcher />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-md bg-panel/50">
                    <div className="text-sm">{t('profile.theme')}</div>
                    <Button size="sm" variant="outline" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                      {theme === 'dark' ? String(t('profile.light') || 'Light') : String(t('profile.dark') || 'Dark')}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-md bg-panel/50">
                    <div className="text-sm">{t('profile.role')}</div>
                    <Button size="sm" variant="outline" onClick={async () => {
                      const confirmSwitch = window.confirm(String(t('profile.confirmSwitch') || 'Are you sure you want to switch your role?'));
                      if (!confirmSwitch) return;
                      await updateProfile({ isProvider: !(currentUser?.isProvider ?? false) });
                      await queryClient.invalidateQueries({ queryKey: ['/api/me'] });
                    }}>
                      {currentUser?.isProvider ? String(t('profile.switchToBuyer') || 'Switch to Buyer') : String(t('profile.switchToProvider') || 'Switch to Provider')}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-md bg-panel/50">
                    <div className="text-sm">{t('profile.updateLocation')}</div>
                    <Button size="sm" variant="secondary" onClick={() => setShowLocationPicker(true)}>
                      {String(t('twa.pickOnMap') || 'Pick on map')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isOwnProfile && (
              <Card className="glass-panel border-brand-accent/20">
                <CardContent className="p-4">
                  <div className="font-semibold mb-3">{t('profile.rateUser')}</div>
                  {orderIdFromQuery ? (
                    <>
                      <RatingForm
                        orderId={orderIdFromQuery}
                        toUserId={data.id}
                        onSuccess={() => { /* no-op on profile page */ }}
                      />
                      <div className="text-xs text-text-muted mt-2">{t('profile.ratingNote')}</div>
                    </>
                  ) : (
                    <div className="text-sm text-text-muted">{t('profile.ratingEligibilityHint')}</div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    {showLocationPicker && (
      <LocationPicker
        initialLocation={typeof data?.location === 'object' ? (data.location as any) : undefined}
        onLocationSelect={async (loc) => {
          await updateProfile({ location: loc });
          setShowLocationPicker(false);
          await queryClient.invalidateQueries({ queryKey: ['/api/me'] });
        }}
        onClose={() => setShowLocationPicker(false)}
        hideCloseButton
      />
    )}
    </div>
  );
}
