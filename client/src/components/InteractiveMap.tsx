import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { mapService } from "@/lib/map";
import { getAuthToken } from "@/lib/auth";
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";

interface InteractiveMapProps {
  onOrderClick?: (order: any) => void;
  onProviderClick?: (provider: any) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  className?: string;
  isClickable?: boolean;
}

export function InteractiveMap({
  onOrderClick,
  onProviderClick,
  initialCenter = [37.6176, 55.7558],
  initialZoom = 10,
  className = "",
  isClickable = true
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const { theme } = useTheme()
  const { t, i18n } = useTranslation();

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/me'],
    enabled: true,
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch('/api/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
  });

  // Fetch orders
  const { data: allOrders = [], isLoading: isLoadingOrders } = useQuery<any[]>({
    queryKey: ['/api/orders'],
    queryFn: async () => {

      const token = getAuthToken();
      try {
        const response = await fetch('/api/orders', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          throw new Error('Failed to fetch all orders');
        }
        const data = await response.json();
        return Array.isArray(data.orders) ? data.orders : [];
      } catch (error) {
        console.error('[INTERACTIVE_MAP] Failed to fetch all orders:', error);
        return [];
      }
    },
    enabled: !!currentUser?.isProvider,
  });

  // Fetch providers
  const { data: providers = [], isLoading: isLoadingProviders } = useQuery<any[]>({
    queryKey: ['/api/users/all'],
    queryFn: async () => {

      const token = getAuthToken();
      try {
        const response = await fetch('/api/users/all', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          throw new Error('Failed to fetch providers');
        }
        const data = await response.json();
        return Array.isArray(data.users) ? data.users : [];
      } catch (error) {
        console.error('[INTERACTIVE_MAP] Failed to fetch providers:', error);
        return [];
      }
    },
    enabled: !currentUser?.isProvider,
  });

  const filteredProviders = useMemo(() => {
    return providers.filter(provider => provider.isProvider && provider.isActive);
  }, [providers]);

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !isMapInitialized) {
      try {
        mapService.initializeMap(mapContainerRef.current, initialCenter, initialZoom, theme);
        setIsMapInitialized(true);
        console.log('[INTERACTIVE_MAP] Map initialized successfully');

        // Add global accept order function
        (window as any).acceptOrder = (orderId: string) => {
          console.log('[INTERACTIVE_MAP] Accept order clicked:', orderId);
          // This will be handled by the OrderAcceptButton component
          // For now, just log the action
        };
      } catch (error) {
        console.error('[INTERACTIVE_MAP] Failed to initialize map:', error);
      }
    }

    return () => {
      if (isMapInitialized) {
        mapService.destroy();
        setIsMapInitialized(false);
      }
      // Clean up global function
      delete (window as any).acceptOrder;
    };
  }, [initialCenter, initialZoom, isMapInitialized]);

  // useEffect for markers
  useEffect(() => {
    if (!isMapInitialized || !mapService.map) return;

    mapService.clearMarkers();

    if (currentUser?.isProvider) {
      mapService.addOrderMarkers(allOrders, currentUser, onOrderClick, isClickable);
      if (allOrders.length > 0) {
        setTimeout(() => mapService.fitBounds(), 100);
      }
    } else {
      // Use filteredProviders here
      mapService.addProviderMarkers(filteredProviders, currentUser, onProviderClick, isClickable);
      if (filteredProviders.length > 0) {
        setTimeout(() => mapService.fitBounds(), 100);
      }
    }
  }, [isMapInitialized, allOrders, filteredProviders, currentUser, onOrderClick, onProviderClick, isClickable]);

  // theme update useEffect
  useEffect(() => {
    if (!mapService.map || !theme) return;

    const style = theme === "dark"
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/light-v11";

    mapService.map.setStyle(style);
  }, [theme]);

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-lg overflow-hidden"
      />

      {/* Loading Overlay */}
      {isLoadingOrders || isLoadingProviders ? (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg z-10">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm mt-2 text-center">
              {t('uploading')}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
