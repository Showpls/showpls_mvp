import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { mapService } from "@/lib/map";
import { getAuthToken } from "@/lib/auth";
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTheme } from "next-themes";

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

  // Fetch orders if user is a provider
  const { data: allOrders = [], isLoading: isLoadingOrders } = useQuery<any[]>({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      if (!currentUser?.isProvider) return [];
      
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

  // Fetch providers if user is not a provider
  const { data: providers = [], isLoading: isLoadingProviders } = useQuery<any[]>({
    queryKey: ['/api/providers'],
    queryFn: async () => {
      if (currentUser?.isProvider) return [];
      
      const token = getAuthToken();
      try {
        const response = await fetch('/api/providers', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          throw new Error('Failed to fetch providers');
        }
        const data = await response.json();
        return Array.isArray(data.providers) ? data.providers : [];
      } catch (error) {
        console.error('[INTERACTIVE_MAP] Failed to fetch providers:', error);
        return [];
      }
    },
    enabled: !currentUser?.isProvider,
  });

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

  // Effect to update map markers when orders or providers change
  useEffect(() => {
    if (!isMapInitialized) return;

    if (currentUser?.isProvider) {
      mapService.addOrderMarkers(allOrders, currentUser, onOrderClick, isClickable);
      if (allOrders.length > 0) {
        setTimeout(() => mapService.fitBounds(), 100);
      }
    } else {
      mapService.addProviderMarkers(providers, currentUser, onProviderClick, isClickable);
      if (providers.length > 0) {
        setTimeout(() => mapService.fitBounds(), 100);
      }
    }
  }, [isMapInitialized, allOrders, providers, currentUser, onOrderClick, onProviderClick, isClickable]);

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
              {currentUser?.isProvider ? 'Загрузка заказов...' : 'Загрузка специалистов...'}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
