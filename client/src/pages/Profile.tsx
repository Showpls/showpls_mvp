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
import { MapPin, ShoppingCart, Store, User, Star, Settings, ArrowLeft } from "lucide-react";

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
  const [locationPath, setLocationPath] = useLocation();
  const { t } = useTranslation();
  const { currentUser, refetch: refetchCurrentUser } = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [roleSwitchDirection, setRoleSwitchDirection] = useState<'toProvider' | 'toBuyer' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<PublicUserProfile>({
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

    console.log('Updating profile with payload:', payload);

    const res = await fetch('/api/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Network error' }));
      console.error('Update profile error:', errorData);
      throw new Error(errorData.error || errorData.message || `Server error: ${res.status}`);
    }

    const result = await res.json();
    console.log('Profile updated successfully:', result);
    return result;
  };

  const invalidateAllQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['/api/me'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/providers'] }),
      queryClient.invalidateQueries({ queryKey: ['currentUser'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/users', id] })
    ]);
  };

  const handleRoleSwitch = async (direction: 'toProvider' | 'toBuyer') => {
    const confirmMessage = direction === 'toProvider'
      ? (t('profile.confirmSwitchToProvider') || 'Are you sure you want to become a seller? You will need to set your location.')
      : (t('profile.confirmSwitchToBuyer') || 'Are you sure you want to become a buyer? Your location will be cleared.');

    const confirmSwitch = window.confirm(confirmMessage);
    if (!confirmSwitch) return;

    console.log(`Starting role switch to: ${direction}`);
    setIsUpdating(true);

    try {
      if (direction === 'toProvider') {
        // For switching TO provider, we need location first
        console.log('Setting up to switch to provider - showing location picker');
        setRoleSwitchDirection('toProvider');
        setShowLocationPicker(true);
      } else {
        // For switching FROM provider (back to buyer) - do it immediately
        console.log('Switching to buyer immediately');
        await handleSwitchToBuyer();
      }
    } catch (error: any) {
      console.error('Error in role switch:', error);
      alert(t('profile.roleSwitchError') || `Failed to switch role: ${error.message}`);
      setIsUpdating(false);
      setRoleSwitchDirection(null);
    }
  };

  const handleSwitchToBuyer = async () => {
    try {
      console.log('Executing switch to buyer');

      const updatedUser = await updateProfile({
        isProvider: false,
        location: null
      });

      console.log('Successfully switched to buyer:', updatedUser);

      // Invalidate and refetch all data
      await invalidateAllQueries();
      await Promise.all([
        refetch(),
        refetchCurrentUser()
      ]);

      // Show success message
      alert(t('profile.roleSwitchedToBuyer') || 'You are now a buyer! Your location has been cleared.');

    } catch (error: any) {
      console.error('Error switching to buyer:', error);
      throw error;
    } finally {
      setIsUpdating(false);
      setRoleSwitchDirection(null);
    }
  };

  const handleLocationSelect = async (loc: any) => {
    console.log('Location selected:', loc);
    setIsUpdating(true);

    try {
      const payload: any = { location: loc };

      // If we're in the middle of switching to provider, also set isProvider
      if (roleSwitchDirection === 'toProvider') {
        payload.isProvider = true;
        console.log('Including isProvider: true in payload for role switch');
      }

      console.log('Updating profile with payload:', payload);

      const updatedUser = await updateProfile(payload);
      console.log('Profile updated successfully:', updatedUser);

      // Invalidate and refetch all data
      await invalidateAllQueries();
      await Promise.all([
        refetch(),
        refetchCurrentUser()
      ]);

      // Close location picker and reset state
      setShowLocationPicker(false);
      const wasRoleSwitch = roleSwitchDirection === 'toProvider';
      setRoleSwitchDirection(null);

      // Show appropriate success message
      if (wasRoleSwitch) {
        alert(t('profile.roleSwitchedToProvider') || 'You are now a seller! Your location has been set.');
      } else {
        alert(t('profile.locationUpdated') || 'Your location has been updated.');
      }

    } catch (error: any) {
      console.error('Error updating location:', error);
      alert(t('profile.locationUpdateError') || `Failed to update location: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseLocationPicker = () => {
    console.log('Closing location picker');
    setShowLocationPicker(false);
    setRoleSwitchDirection(null);
    setIsUpdating(false);
  };

  const shouldShowLocationPicker = showLocationPicker;
  const shouldShowOverlay = isUpdating && !showLocationPicker;

  console.log('Current user state:', {
    currentUser: currentUser?.isProvider,
    profileData: data?.isProvider,
    isUpdating,
    roleSwitchDirection,
    shouldShowLocationPicker,
    shouldShowOverlay
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="glass-panel p-4 mb-4 sticky top-0 z-40 shadow-md">
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="mr-2 text-foreground" onClick={() => setLocationPath('/twa')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-semibold text-sm">{initial}</span>
              </div>
              <div>
                <div className="font-semibold text-lg">{displayName}</div>
                {data?.username && (
                  <div className="text-xs text-muted font-medium">@{data.username}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-4 pb-20 space-y-6 font-medium">
        {isLoading && (
          <div className="text-center text-muted py-8">{t('profile.loading')}</div>
        )}
        {isError && (
          <div className="text-center text-red-400 py-8">{t('profile.failedToLoad') || 'Failed to load profile'}</div>
        )}
        {!isLoading && !isError && data && (
          <>
            {/* User Stats Card */}
            <Card className="glass-panel border-brand-primary/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <User className="w-5 h-5 mr-2 text-brand-primary" />
                    <h3 className="font-semibold">{t('profile.userInfo') || 'User Information'}</h3>
                  </div>
                  {(data.isProvider || currentUser?.isProvider) && (
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                      {t('profile.provider') || 'Seller'}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="glass-panel p-3 rounded-md flex flex-col items-center">
                    <Star className="w-5 h-5 text-yellow-500 mb-1" />
                    <div className="text-xs text-muted">{t('profile.rating')}</div>
                    <div className="font-semibold text-foreground text-lg">{Number(data.rating ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="glass-panel p-3 rounded-md flex flex-col items-center">
                    <ShoppingCart className="w-5 h-5 text-brand-primary mb-1" />
                    <div className="text-xs text-muted">{t('profile.totalOrders')}</div>
                    <div className="font-semibold text-foreground text-lg">{data.totalOrders ?? 0}</div>
                  </div>
                </div>

                <div className="glass-panel p-3 rounded-md">
                  <div className="flex items-center mb-1">
                    <MapPin className="w-4 h-4 mr-2 text-brand-primary" />
                    <div className="text-xs text-muted">{t('profile.location')}</div>
                  </div>
                  <div className="font-semibold text-foreground text-sm truncate">
                    {typeof data.location === 'string'
                      ? data.location
                      : data.location && typeof data.location === 'object'
                        ? `${Number((data.location as any).lat).toFixed(5)}, ${Number((data.location as any).lng).toFixed(5)}`
                        : t('profile.locationUnknown')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {isOwnProfile && (
              <>
                {/* Role Management Card */}
                <Card className="glass-panel border-brand-primary/20">
                  <CardContent className="p-5">
                    <div className="flex items-center mb-4">
                      <Settings className="w-5 h-5 mr-2 text-brand-primary" />
                      <h3 className="font-semibold">{t('profile.roleManagement') || 'Role Management'}</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col space-y-2">
                        <div className="text-sm text-muted">{t('profile.currentRole') || 'Current Role'}</div>
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2 h-12"
                          onClick={() => handleRoleSwitch(currentUser?.isProvider ? 'toBuyer' : 'toProvider')}
                          disabled={isUpdating && !showLocationPicker}
                        >
                          {(isUpdating && !showLocationPicker) ? (
                            <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
                          ) : currentUser?.isProvider ? (
                            <Store className="w-5 h-5" />
                          ) : (
                            <ShoppingCart className="w-5 h-5" />
                          )}
                          {(isUpdating && !showLocationPicker)
                            ? (t('profile.updating') || 'Updating...')
                            : currentUser?.isProvider
                              ? String(t('twa.roleBuyer') || 'Switch to Buyer')
                              : String(t('twa.roleProvider') || 'Switch to Seller')
                          }
                        </Button>
                      </div>

                      {(currentUser?.isProvider || data?.isProvider) && (
                        <div className="flex flex-col space-y-2">
                          <div className="text-sm text-muted">{t('profile.updateLocation') || 'Update Location'}</div>
                          <Button
                            size="lg"
                            className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white flex items-center justify-center gap-2 h-12"
                            onClick={() => {
                              setRoleSwitchDirection(null);
                              setShowLocationPicker(true);
                            }}
                            disabled={isUpdating && !showLocationPicker}
                          >
                            <MapPin className="w-5 h-5" />
                            {String(t('twa.pickOnMap') || 'Pick on map')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Preferences Card */}
                <Card className="glass-panel border-brand-primary/20">
                  <CardContent className="p-5">
                    <div className="flex items-center mb-4">
                      <Settings className="w-5 h-5 mr-2 text-brand-primary" />
                      <h3 className="font-semibold">{t('profile.preferences') || 'Preferences'}</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-md bg-[#fffff0] dark:bg-panel">
                        <div className="text-sm">{t('profile.language') || 'Language'}</div>
                        <LanguageSwitcher />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-md bg-[#fffff0] dark:bg-panel">
                        <div className="text-sm">{t('profile.theme') || 'Theme'}</div>
                        <Button size="sm" variant="outline" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                          {theme === 'dark' ? String(t('profile.light') || 'Light') : String(t('profile.dark') || 'Dark')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {!isOwnProfile && (
              <Card className="glass-panel border-brand-accent/20">
                <CardContent className="p-5">
                  <div className="flex items-center mb-4">
                    <Star className="w-5 h-5 mr-2 text-brand-accent" />
                    <h3 className="font-semibold">{t('profile.rateUser') || 'Rate User'}</h3>
                  </div>

                  {orderIdFromQuery ? (
                    <>
                      <RatingForm
                        orderId={orderIdFromQuery}
                        toUserId={data.id}
                        onSuccess={() => { /* no-op on profile page */ }}
                      />
                      <div className="text-xs text-muted font-medium mt-3">{t('profile.ratingNote') || 'You can rate this user after completing an order with them.'}</div>
                    </>
                  ) : (
                    <div className="text-sm text-muted font-medium">{t('profile.ratingEligibilityHint') || 'You need to complete an order with this user before you can rate them.'}</div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {shouldShowLocationPicker && (
        <LocationPicker
          initialLocation={typeof data?.location === 'object' ? (data.location as any) : undefined}
          onLocationSelect={handleLocationSelect}
          onClose={handleCloseLocationPicker}
          hideCloseButton={false}
          hideUseCurrentButton={false}
        />
      )}

      {shouldShowOverlay && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="glass-panel p-6 rounded-lg text-center">
            <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-4" />
            <div className="text-sm font-medium">{t('profile.updating') || 'Updating profile...'}</div>
          </div>
        </div>
      )}
    </div>
  );
}