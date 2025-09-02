import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Camera, Video, Radio, Crosshair } from "lucide-react";
import { getAuthToken } from "@/lib/auth";
import { locationService } from "@/lib/location";
import { InteractiveMap } from "./InteractiveMap";
import { OrderAcceptButton } from "./OrderAcceptButton";
import { Order } from "@/lib/map";

interface MapViewProps {
  selectedMediaType: string;
  onMediaTypeChange: (mediaType: string) => void;
  isClickable?: boolean;
}

export function MapView({ selectedMediaType, onMediaTypeChange, isClickable = true }: MapViewProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Initialize location service
    const initLocation = async () => {
      try {
        await locationService.initialize();
        console.log('[MAP] Location service initialized successfully');
      } catch (err) {
        console.error('[MAP] Failed to initialize location service:', err);
        setError('Failed to initialize location services');
      }
    };

    initLocation();

    // Cleanup on unmount
    return () => {
      locationService.destroy();
    };
  }, []);



// Update the near me handler to use proper error handling
const handleNearMe = async () => {
  setError(null);
  setLoading(true);

  try {
    const location = await locationService.getCurrentLocation();
    const token = getAuthToken();
    
    const response = await fetch(
      `/api/orders/nearby?lat=${location.latitude}&lng=${location.longitude}&radius=15`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    setOrders(Array.isArray(data.orders) ? data.orders : []);
  } catch (e: any) {
    console.error('[MAP] Location error:', e);
    setError(e.message || t('map.locationError') || 'Failed to get your location');
  } finally {
    setLoading(false);
  }
};

  const filteredOrders = orders.filter((o) =>
    !selectedMediaType || o.mediaType === selectedMediaType
  );

  return (
    <div>
      {/* Interactive Map */}
      <InteractiveMap
        onOrderClick={isClickable ? (order) => {
          console.log('Order clicked:', order);
          // Handle order click - could open details modal or navigate to order page
        } : undefined}
        isClickable={isClickable}
        className="h-64"
      />

      {/* Map Controls */}
      {(isClickable || error || filteredOrders.length > 0) && (
        <div className="p-4 bg-panel/50">
          {isClickable && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant={selectedMediaType === 'photo' ? 'default' : 'outline'}
                  className={`${selectedMediaType === 'photo'
                    ? 'bg-brand-primary text-white'
                    : 'bg-panel text-text-muted border-brand-primary/30'
                    }`}
                  onClick={() => onMediaTypeChange('photo')}
                >
                  <Camera className="w-3 h-3 mr-1" />
                  {t('mediaType.photo')}
                </Button>
                <Button
                  size="sm"
                  variant={selectedMediaType === 'video' ? 'default' : 'outline'}
                  className={`${selectedMediaType === 'video'
                    ? 'bg-brand-primary text-white'
                    : 'bg-panel text-text-muted border-brand-primary/30'
                    }`}
                  onClick={() => onMediaTypeChange('video')}
                >
                  <Video className="w-3 h-3 mr-1" />
                  {t('mediaType.video')}
                </Button>
                <Button
                  size="sm"
                  variant={selectedMediaType === 'live' ? 'default' : 'outline'}
                  className={`${selectedMediaType === 'live'
                    ? 'bg-brand-primary text-white'
                    : 'bg-panel text-text-muted border-brand-primary/30'
                    }`}
                  onClick={() => onMediaTypeChange('live')}
                >
                  <Radio className="w-3 h-3 mr-1" />
                  {t('mediaType.live')}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-brand-accent hover:text-brand-accent/80"
                onClick={handleNearMe}
                disabled={loading}
              >
                <Crosshair className="w-4 h-4 mr-1" />
                {loading ? (t('map.searching') || 'Поиск...') : (t('map.nearMe') || 'Рядом со мной')}
              </Button>
            </div>
          )}
          {error && (
            <div className="text-red-400 text-xs mt-2">{error}</div>
          )}
          {filteredOrders.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-sm text-text-muted">
                {t('map.found') || 'Найдено'}: {filteredOrders.length}
              </div>
              <div className="grid gap-2">
                {filteredOrders.map((o) => (
                  <div key={o.id} className="p-3 bg-panel rounded border border-white/10 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-text-primary">{o.title}</div>
                      <div className="text-xs text-text-muted">{o.mediaType} • {o.location?.address || `${o.location?.lat}, ${o.location?.lng}`}</div>
                    </div>
                    {isClickable && <OrderAcceptButton orderId={o.id} orderStatus={o.status} requesterId={o.requesterId} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
