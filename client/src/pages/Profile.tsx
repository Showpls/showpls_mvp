import { useMemo, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingForm } from "@/components/RatingForm";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTheme } from "next-themes";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getAuthToken } from "@/lib/auth";
import { LocationPicker } from "@/components/LocationPicker";
import { MapPin, ShoppingCart, Store, User, Star, Settings, ArrowLeft, UserCog, X, Check, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PublicUserProfile {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  rating?: number;
  totalOrders?: number;
  isProvider?: boolean;
  isActive?: boolean;
  location?: string | { lat: number; lng: number };
  photoUrl?: string;
}

// Custom Confirmation Dialog Component
const ConfirmDialog = (props: any) => {
  const { t } = useTranslation();
  const { isOpen, title, message, onConfirm, onCancel, isLoading } = props;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="glass-panel p-6 rounded-lg max-w-sm w-full">
        <h3 className="font-semibold text-foreground mb-4 text-lg">{title}</h3>
        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            {t('profile.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {t('profile.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
};

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

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    direction: null as 'toProvider' | 'toBuyer' | null
  });

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

  const isOwnProfile = currentUser?.id && data?.id && currentUser?.id === data.id;

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

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || errorData.message || `Server error: ${res.status}`);
    }

    return await res.json();
  };

  const invalidateAllQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['/api/me'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/users', id] })
    ]);
  };

  const handleRoleSwitch = async (direction: 'toProvider' | 'toBuyer') => {
    const confirmMessage = direction === 'toProvider'
      ? (t('profile.confirmSwitchToProvider') || 'Are you sure you want to become a seller? You will need to set your location.')
      : (t('profile.confirmSwitchToBuyer') || 'Are you sure you want to become a buyer? Your location will be cleared.');

    const confirmTitle = direction === 'toProvider'
      ? t('profile.switchToProviderTitle')
      : t('profile.switchToBuyerTitle');

    // Show custom confirmation dialog instead of window.confirm
    setConfirmDialog({
      isOpen: true,
      title: confirmTitle,
      message: confirmMessage,
      direction: direction,
      onConfirm: () => confirmRoleSwitch(direction)
    });
  };

  const confirmRoleSwitch = async (direction: 'toProvider' | 'toBuyer') => {
    // Close the confirmation dialog
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));

    setIsUpdating(true);

    try {
      if (direction === 'toProvider') {
        setRoleSwitchDirection('toProvider');
        setShowLocationPicker(true);
      } else {
        await handleSwitchToBuyer();
      }
    } catch (error: any) {
      console.error('Error in role switch:', error);
      // Use alert as fallback since it usually works in Telegram
      alert(t('profile.roleSwitchError') || `Failed to switch role: ${error.message}`);
      setIsUpdating(false);
      setRoleSwitchDirection(null);
    }
  };

  const handleSwitchUserActive = async () => {
    try {
      setIsUpdating(true);
      await updateProfile({
        isActive: !currentUser.isActive
      });

      // Update cache immediately
      queryClient.setQueryData(['/api/me'], (old: any) => {
        return old ? { ...old, isActive: !currentUser.isActive } : old;
      });

      if (data?.id === currentUser?.id) {
        queryClient.setQueryData(['/api/users', id], (old: any) => {
          return old ? { ...old, isActive: !currentUser.isActive } : old;
        });
      }

      await refetchCurrentUser();
      await invalidateAllQueries();

      alert(t('profile.switchActiveStatus'));
    } catch (error: any) {
      console.error('Error switching active state:', error);
      alert(t('profile.switchActiveStatusError') || `Failed to switch active status: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  }

  const handleSwitchToBuyer = async () => {
    try {
      const updatedUser = await updateProfile({
        isProvider: false,
        location: null
      });

      // Update cache immediately
      queryClient.setQueryData(['/api/me'], (old: any) => {
        return old ? { ...old, isProvider: false, location: null } : old;
      });

      if (data?.id === currentUser?.id) {
        queryClient.setQueryData(['/api/users', id], (old: any) => {
          return old ? { ...old, isProvider: false, location: null } : old;
        });
      }

      await refetchCurrentUser();
      await invalidateAllQueries();

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
    setIsUpdating(true);
    setShowLocationPicker(false);

    try {
      const payload: any = { location: loc };

      if (roleSwitchDirection === 'toProvider') {
        payload.isProvider = true;
      }

      const updatedUser = await updateProfile(payload);

      // Update cache immediately
      queryClient.setQueryData(['/api/me'], (old: any) => {
        return old ? { ...old, ...payload } : old;
      });

      if (data?.id === currentUser?.id) {
        queryClient.setQueryData(['/api/users', id], (old: any) => {
          return old ? { ...old, ...payload } : old;
        });
      }

      await refetchCurrentUser();
      await invalidateAllQueries();

      const wasRoleSwitch = roleSwitchDirection === 'toProvider';
      setRoleSwitchDirection(null);

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
    setShowLocationPicker(false);
    setRoleSwitchDirection(null);
    setIsUpdating(false);
  };

  const handleCancelConfirmation = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const shouldShowLocationPicker = showLocationPicker;
  const shouldShowOverlay = isUpdating && !showLocationPicker && !confirmDialog.isOpen;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-y-auto">
      <div className="glass-panel p-4 mb-4 sticky top-0 z-40 shadow-md">
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="mr-2 text-foreground hover:bg-brand-primary/10"
              onClick={() => setLocationPath('/twa')}
            >
              <ArrowLeft className="w-5 h-5 flex-shrink-0" />
            </Button>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-white font-semibold text-sm">{initial}</span>
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-lg text-foreground truncate">{displayName}</div>
                {data?.username && (
                  <div className="text-xs text-muted-foreground font-medium truncate">@{data.username}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-4 pb-20 space-y-6 font-medium">
        {isLoading && (
          <div className="text-center text-muted-foreground py-8 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            {t('profile.loading')}
          </div>
        )}
        {isError && (
          <div className="text-center text-destructive py-8 flex flex-col items-center">
            <X className="w-8 h-8 mb-4" />
            {t('profile.failedToLoad')}
          </div>
        )}
        {!isLoading && !isError && data && (
          <>
            {/* User Stats Card */}
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <User className="w-5 h-5 mr-2 text-brand-primary flex-shrink-0" />
                    <span className="text-foreground font-medium">{t('profile.userInfo')}</span>
                  </div>
                  {(data.isProvider || currentUser?.isProvider) && (
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                      {t('profile.provider')}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-muted p-4 rounded-md flex flex-col items-center">
                    <Star className="w-5 h-5 text-yellow-500 mb-2 flex-shrink-0" />
                    <div className="text-xs text-muted-foreground text-center mb-1">{t('profile.rating')}</div>
                    <div className="font-semibold text-foreground text-lg">{Number(data.rating ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-muted p-4 rounded-md flex flex-col items-center">
                    <ShoppingCart className="w-5 h-5 text-brand-primary mb-2 flex-shrink-0" />
                    <div className="text-xs text-muted-foreground text-center mb-1">{t('profile.totalOrders')}</div>
                    <div className="font-semibold text-foreground text-lg">{data.totalOrders ?? 0}</div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-md">
                  <div className="flex items-center mb-2">
                    <MapPin className="w-4 h-4 mr-2 text-brand-primary flex-shrink-0" />
                    <div className="text-xs text-muted-foreground">{t('profile.location')}</div>
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
                <Card className="border-border">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center">
                      <UserCog className="w-5 h-5 mr-2 text-brand-primary flex-shrink-0" />
                      {t('profile.role')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <Button
                        size="lg"
                        className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white flex items-center justify-center gap-2 h-12"
                        onClick={() => handleRoleSwitch(currentUser?.isProvider ? 'toBuyer' : 'toProvider')}
                        disabled={isUpdating && !showLocationPicker}
                      >
                        {(isUpdating && !showLocationPicker) ? (
                          <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                        ) : currentUser?.isProvider ? (
                          <ShoppingCart className="w-5 h-5 flex-shrink-0" />
                        ) : (
                          <Store className="w-5 h-5 flex-shrink-0" />
                        )}
                        <span>
                          {(isUpdating && !showLocationPicker)
                            ? t('profile.updating')
                            : currentUser?.isProvider
                              ? t('profile.switchToBuyer')
                              : t('profile.switchToProvider')
                          }
                        </span>
                      </Button>
                    </div>

                    {(currentUser?.isProvider || data?.isProvider) && (
                      <div className="flex flex-col space-y-2">
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full text-foreground hover:bg-brand-primary/10 flex items-center justify-center gap-2 h-12"
                          onClick={() => {
                            setRoleSwitchDirection(null);
                            setShowLocationPicker(true);
                          }}
                          disabled={isUpdating && !showLocationPicker}
                        >
                          <MapPin className="w-5 h-5 flex-shrink-0" />
                          <span>{t('profile.updateLocation')}</span>
                        </Button>
                      </div>
                    )}

                    {/* Active Status Switcher */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div className="flex flex-col space-y-1">
                        <Label htmlFor="active-status" className="text-sm font-medium text-foreground">
                          {t('profile.activeStatus')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('profile.activeStatusDescription')}
                        </p>
                      </div>
                      <Switch
                        id="active-status"
                        checked={currentUser?.isActive}
                        onCheckedChange={handleSwitchUserActive}
                        disabled={isUpdating}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Preferences Card */}
                <Card className="border-border">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center">
                      <Settings className="w-5 h-5 mr-2 text-brand-primary flex-shrink-0" />
                      {t('profile.settings')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div className="text-sm font-medium text-foreground">{t('profile.language')}</div>
                      <LanguageSwitcher />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div className="text-sm font-medium text-foreground">{t('profile.theme')}</div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-brand-primary/10"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      >
                        {theme === 'dark' ? t('profile.light') : t('profile.dark')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {!isOwnProfile && (
              <Card className="border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <Star className="w-5 h-5 mr-2 text-brand-accent flex-shrink-0" />
                    {t('profile.rateUser')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orderIdFromQuery ? (
                    <>
                      <RatingForm
                        orderId={orderIdFromQuery}
                        toUserId={data.id}
                        onSuccess={() => { /* no-op on profile page */ }}
                      />
                      <div className="text-xs text-muted-foreground font-medium mt-3">{t('profile.ratingNote')}</div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground font-medium">{t('profile.ratingEligibilityHint')}</div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Custom Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={handleCancelConfirmation}
        isLoading={isUpdating}
      />

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
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 flex-shrink-0" />
            <div className="text-sm font-medium text-foreground">{t('profile.updating')}</div>
          </div>
        </div>
      )}
    </div>
  );
}