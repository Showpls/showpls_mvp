import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Camera, Video, Radio, MapPin, Filter, X, Crosshair } from "lucide-react";
import { mapService, filterOrdersByRadius, filterOrdersByType, filterOrdersByBudget } from "@/lib/map";
import { getAuthToken } from "@/lib/auth";
import { locationService } from "@/lib/location";
import { OrderAcceptButton } from "./OrderAcceptButton";
import 'mapbox-gl/dist/mapbox-gl.css';

interface InteractiveMapProps {
  onOrderClick?: (order: any) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  showFilters?: boolean;
  className?: string;
}

export function InteractiveMap({
  onOrderClick,
  initialCenter = [37.6176, 55.7558],
  initialZoom = 10,
  showFilters = true,
  className = ""
}: InteractiveMapProps) {
  const { t } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState({
    mediaType: '',
    radius: 15,
    minBudget: 0,
    maxBudget: 100,
  });
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

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

  // Fetch orders based on user location
  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ['/api/orders', userLocation],
    enabled: true,
    queryFn: async () => {
      const token = getAuthToken();

      // If user location is available, fetch nearby orders
      if (userLocation) {
        try {
          const response = await fetch(`/api/orders/nearby?lat=${userLocation[1]}&lng=${userLocation[0]}&radius=15`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!response.ok) throw new Error('Failed to fetch nearby orders');
          const data = await response.json();
          return Array.isArray(data.orders) ? data.orders : [];
        } catch (error) {
          console.warn('[INTERACTIVE_MAP] Failed to fetch nearby orders, falling back to all orders:', error);
        }
      }

      // Otherwise fetch all orders (public endpoint)
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      return Array.isArray(data.orders) ? data.orders : [];
    },
  });

  // Initialize location services
  useEffect(() => {
    const initLocation = async () => {
      try {
        await locationService.initialize();
        console.log('[INTERACTIVE_MAP] Location service initialized successfully');
      } catch (err) {
        console.error('[INTERACTIVE_MAP] Failed to initialize location service:', err);
      }
    };

    initLocation();

    return () => {
      locationService.destroy();
    };
  }, []);

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

  // Apply filters and update markers
  useEffect(() => {
    if (!isMapInitialized || !allOrders.length) return;

    let filteredOrders = [...allOrders];

    // Apply media type filter
    if (filters.mediaType) {
      filteredOrders = filterOrdersByType(filteredOrders, filters.mediaType);
    }

    // Apply budget filter
    filteredOrders = filterOrdersByBudget(filteredOrders, filters.minBudget, filters.maxBudget);

    // Apply radius filter if user location is available
    if (userLocation) {
      filteredOrders = filterOrdersByRadius(filteredOrders, userLocation[1], userLocation[0], filters.radius);
    }

    // Add markers to map
    mapService.addOrderMarkers(filteredOrders, currentUser, onOrderClick);

    // Fit bounds if we have markers
    if (filteredOrders.length > 0) {
      setTimeout(() => mapService.fitBounds(), 100);
    }
  }, [isMapInitialized, allOrders, filters, userLocation, onOrderClick]);

  // Get user location
  const getUserLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      console.log('[INTERACTIVE_MAP] Location received:', location);

      const newLocation: [number, number] = [location.longitude, location.latitude];
      setUserLocation(newLocation);
      mapService.setCenter(location.longitude, location.latitude);
      mapService.setZoom(12);

    } catch (error: any) {
      console.error('[INTERACTIVE_MAP] Location error:', error);
      alert(error.message || 'Не удалось получить ваше местоположение');
    }
  };

  // Get filtered orders count
  const getFilteredOrdersCount = () => {
    let filtered = [...allOrders];
    if (filters.mediaType) {
      filtered = filterOrdersByType(filtered, filters.mediaType);
    }
    if (userLocation) {
      filtered = filterOrdersByRadius(filtered, userLocation[1], userLocation[0], filters.radius);
    }
    filtered = filterOrdersByBudget(filtered, filters.minBudget, filters.maxBudget);
    return filtered.length;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-96 rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />

      {/* Map Controls Overlay */}
      <div className="absolute top-4 left-4 space-y-2">
        {/* Location Button */}
        <Button
          size="sm"
          variant="secondary"
          onClick={getUserLocation}
          className="bg-white/90 hover:bg-white text-gray-800 shadow-lg"
        >
          <Crosshair className="w-4 h-4 mr-1" />
          {t('map.myLocation') || 'Мое местоположение'}
        </Button>

        {/* Filter Toggle */}
        {showFilters && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="bg-white/90 hover:bg-white text-gray-800 shadow-lg"
          >
            <Filter className="w-4 h-4 mr-1" />
            {t('map.filters') || 'Фильтры'}
            {getFilteredOrdersCount() > 0 && (
              <Badge variant="secondary" className="ml-2 bg-blue-500 text-white">
                {getFilteredOrdersCount()}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Mobile Filter Panel */}
      {showFilters && showFilterPanel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{t('map.filters') || 'Фильтры'}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowFilterPanel(false)}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Media Type Filter */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">{t('map.mediaType') || 'Тип контента'}</label>
                <Select
                  value={filters.mediaType}
                  onValueChange={(value) => setFilters({ ...filters, mediaType: value })}
                >
                  <SelectTrigger className="w-full bg-gray-50 border-gray-300 text-gray-900">
                    <SelectValue placeholder={t('map.allTypes') || 'Все типы'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">{t('map.allTypes') || 'Все типы'}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="photo">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-900">{t('mediaType.photo') || 'Фото'}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-red-600" />
                        <span className="text-gray-900">{t('mediaType.video') || 'Видео'}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="live">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-green-600" />
                        <span className="text-gray-900">{t('mediaType.live') || 'Прямая трансляция'}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Radius Filter */}
              {userLocation && (
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-900">
                    {t('map.radius') || 'Радиус поиска'}: {filters.radius} км
                  </label>
                  <div className="px-3">
                    <Slider
                      value={[filters.radius]}
                      onValueChange={(value) => setFilters({ ...filters, radius: value[0] })}
                      max={50}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1 км</span>
                      <span>50 км</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Budget Filter */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">
                  {t('map.budget') || 'Бюджет'}: {filters.minBudget}-{filters.maxBudget} TON
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Минимум</label>
                    <input
                      type="number"
                      value={filters.minBudget}
                      onChange={(e) => setFilters({ ...filters, minBudget: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Максимум</label>
                    <input
                      type="number"
                      value={filters.maxBudget}
                      onChange={(e) => setFilters({ ...filters, maxBudget: parseInt(e.target.value) || 100 })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>

              {/* Results Count */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm font-medium text-blue-900">
                  {t('map.found') || 'Найдено'}: {getFilteredOrdersCount()} {t('map.orders') || 'заказов'}
                </div>
              </div>
              
              {/* Apply Button */}
              <Button
                onClick={() => setShowFilterPanel(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                Применить фильтры
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm mt-2">{t('map.loading') || 'Загрузка карты...'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
