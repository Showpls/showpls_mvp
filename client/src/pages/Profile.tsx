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
import { MapPin, ShoppingCart, Store, User, Star, Settings, ArrowLeft, UserCog } from "lucide-react";

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

  const isOwnProfile = currentUser?.id && data?.id && currentUser?.id === data.id;

  const invalidateAllQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['/api/me'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/providers'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/users', id] })
    ]);
  };

  const handleRoleSwitch = async (direction: 'toProvider' | 'toBuyer') => {
    console.log('🔄 Role switch initiated:', direction);
    console.log('Current user:', currentUser);
    console.log('Current isProvider status:', currentUser?.isProvider);
    
    const confirmMessage = direction === 'toProvider'
      ? (t('profile.confirmSwitchToProvider') || 'Are you sure you want to become a seller? You will need to set your location.')
      : (t('profile.confirmSwitchToBuyer') || 'Are you sure you want to become a buyer? Your location will be cleared.');
  
    const confirmSwitch = window.confirm(confirmMessage);
    console.log('User confirmed switch:', confirmSwitch);
    
    if (!confirmSwitch) return;
  
    setIsUpdating(true);
    console.log('Set isUpdating to true');
  
    try {
      if (direction === 'toProvider') {
        console.log('Switching to provider - showing location picker');
        setRoleSwitchDirection('toProvider');
        setShowLocationPicker(true);
      } else {
        console.log('Switching to buyer - calling handleSwitchToBuyer');
        await handleSwitchToBuyer();
      }
    } catch (error: any) {
      console.error('❌ Error in role switch:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      alert(t('profile.roleSwitchError') || `Failed to switch role: ${error.message}`);
      setIsUpdating(false);
      setRoleSwitchDirection(null);
    }
  };
  
  const handleSwitchToBuyer = async () => {
    console.log('🔄 Starting switch to buyer');
    
    try {
      console.log('Calling updateProfile with payload:', { isProvider: false, location: null });
      
      const updatedUser = await updateProfile({
        isProvider: false,
        location: null
      });
      
      console.log('✅ Profile updated successfully:', updatedUser);
  
      // Update cache immediately
      queryClient.setQueryData(['/api/me'], (old: any) => {
        console.log('Updating /api/me cache:', old, '->', { ...old, isProvider: false, location: null });
        return old ? { ...old, isProvider: false, location: null } : old;
      });
  
      if (data?.id === currentUser?.id) {
        queryClient.setQueryData(['/api/users', id], (old: any) => {
          console.log('Updating /api/users cache:', old, '->', { ...old, isProvider: false, location: null });
          return old ? { ...old, isProvider: false, location: null } : old;
        });
      }
  
      console.log('Refetching current user...');
      await refetchCurrentUser();
      
      console.log('Invalidating all queries...');
      await invalidateAllQueries();
  
      console.log('✅ Switch to buyer completed successfully');
      alert(t('profile.roleSwitchedToBuyer') || 'You are now a buyer! Your location has been cleared.');
    } catch (error: any) {
      console.error('❌ Error switching to buyer:', error);
      throw error;
    } finally {
      console.log('Cleaning up state...');
      setIsUpdating(false);
      setRoleSwitchDirection(null);
    }
  };
  
  const updateProfile = async (payload: any) => {
    console.log('🔄 Starting updateProfile with payload:', payload);
    
    const token = getAuthToken();
    console.log('Auth token exists:', !!token);
    console.log('Token preview:', token ? `${token.substring(0, 10)}...` : 'null');
  
    console.log('Making API request to /api/me...');
    const res = await fetch('/api/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
  
    console.log('API response status:', res.status);
    console.log('API response ok:', res.ok);
  
    if (!res.ok) {
      console.error('❌ API request failed');
      const errorData = await res.json().catch(() => ({ error: 'Network error' }));
      console.error('Error response data:', errorData);
      throw new Error(errorData.error || errorData.message || `Server error: ${res.status}`);
    }
  
    const responseData = await res.json();
    console.log('✅ API response data:', responseData);
    return responseData;
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

  const shouldShowLocationPicker = showLocationPicker;
  const shouldShowOverlay = isUpdating && !showLocationPicker;

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
          <div className="text-center text-muted-foreground py-8">{t('profile.loading')}</div>
        )}
        {isError && (
          <div className="text-center text-red-400 py-8">{t('profile.failedToLoad')}</div>
        )}
        {!isLoading && !isError && data && (
          <>
            {/* User Stats Card */}
            <Card className="glass-panel border-brand-primary/20 hover:border-brand-primary/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center mb-4">
                  <User className="w-5 h-5 mr-2 text-brand-primary flex-shrink-0" />
                  {(data.isProvider || currentUser?.isProvider) && (
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                      {t('profile.provider')}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="glass-panel p-3 rounded-md flex flex-col items-center hover:bg-brand-primary/5 transition-colors">
                    <Star className="w-5 h-5 text-yellow-500 mb-1 flex-shrink-0" />
                    <div className="text-xs text-muted-foreground text-center">{t('profile.rating')}</div>
                    <div className="font-semibold text-foreground text-lg">{Number(data.rating ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="glass-panel p-3 rounded-md flex flex-col items-center hover:bg-brand-primary/5 transition-colors">
                    <ShoppingCart className="w-5 h-5 text-brand-primary mb-1 flex-shrink-0" />
                    <div className="text-xs text-muted-foreground text-center">{t('profile.totalOrders')}</div>
                    <div className="font-semibold text-foreground text-lg">{data.totalOrders ?? 0}</div>
                  </div>
                </div>

                <div className="glass-panel p-3 rounded-md hover:bg-brand-primary/5 transition-colors">
                  <div className="flex items-center mb-1">
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
                <Card className="glass-panel border-brand-primary/20 hover:border-brand-primary/40 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center mb-4">
                      <UserCog className="w-5 h-5 mr-2 text-brand-primary flex-shrink-0" />
                      <h3 className="font-semibold text-foreground">{t('profile.role')}</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col space-y-2">
                        <Button
                          size="lg"
                          className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white flex items-center justify-center gap-2 h-12 text-base transition-colors"
                          onClick={() => handleRoleSwitch(currentUser?.isProvider ? 'toBuyer' : 'toProvider')}
                          disabled={isUpdating && !showLocationPicker}
                        >
                          {(isUpdating && !showLocationPicker) ? (
                            <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full flex-shrink-0" />
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
                            className="w-full text-foreground hover:bg-brand-primary/10 flex items-center justify-center gap-2 h-12 text-base transition-colors"
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
                    </div>
                  </CardContent>
                </Card>

                {/* Preferences Card */}
                <Card className="glass-panel border-brand-primary/20 hover:border-brand-primary/40 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center mb-4">
                      <Settings className="w-5 h-5 mr-2 text-brand-primary flex-shrink-0" />
                      <h3 className="font-semibold text-foreground">{t('profile.settings')}</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-md bg-card hover:bg-brand-primary/5 transition-colors">
                        <div className="text-sm text-foreground">{t('profile.language')}</div>
                        <LanguageSwitcher />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-md bg-card hover:bg-brand-primary/5 transition-colors">
                        <div className="text-sm text-foreground">{t('profile.theme')}</div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="hover:bg-brand-primary/10"
                          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                          {theme === 'dark' ? t('profile.light') : t('profile.dark')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {!isOwnProfile && (
              <Card className="glass-panel border-brand-accent/20 hover:border-brand-accent/40 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center mb-4">
                    <Star className="w-5 h-5 mr-2 text-brand-accent flex-shrink-0" />
                    <h3 className="font-semibold text-foreground">{t('profile.rateUser')}</h3>
                  </div>

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
            <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-4 flex-shrink-0" />
            <div className="text-sm font-medium text-foreground">{t('profile.updating')}</div>
          </div>
        </div>
      )}
    </div>
  );
}