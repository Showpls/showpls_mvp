import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { mapService } from "@/lib/map";
import { getAuthToken } from "@/lib/auth";
import 'mapbox-gl/dist/mapbox-gl.css';

interface InteractiveMapProps {
  onOrderClick?: (order: any) => void;
  isClickable?: boolean;
  initialCenter?: [number, number];
  initialZoom?: number;
  className?: string;
}

export function InteractiveMap({
  onOrderClick,
  initialCenter = [37.6176, 55.7558],
  initialZoom = 10,
  className = "",
  isClickable = true
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

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
  const { data: allOrders = [], isLoading } = useQuery<any[]>({
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
        return []; // Return empty array on failure
      }
    },
  });

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !isMapInitialized) {
      try {
        mapService.initializeMap(mapContainerRef.current, initialCenter, initialZoom);
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

  // Effect to update map markers when orders change
  useEffect(() => {
    if (!isMapInitialized) return;

    mapService.addOrderMarkers(allOrders, currentUser, onOrderClick, isClickable);

    if (allOrders.length > 0) {
      setTimeout(() => mapService.fitBounds(), 100);
    }
  }, [isMapInitialized, allOrders, currentUser, onOrderClick]);

  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full rounded-lg overflow-hidden ${className}`}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm mt-2">Загрузка карты...</p>
          </div>
        </div>
      )}
    </div>
  );
}
