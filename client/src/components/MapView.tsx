import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Camera, Video, Radio, Crosshair } from "lucide-react";
import { getAuthToken } from "@/lib/auth";

interface MapViewProps {
  selectedMediaType: string;
  onMediaTypeChange: (mediaType: string) => void;
}

export function MapView({ selectedMediaType, onMediaTypeChange }: MapViewProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  const handleNearMe = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError(t('map.geoNotSupported') || 'Геолокация не поддерживается');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const token = getAuthToken();
          const url = `/api/orders/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radius=15`;
          const res = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || res.statusText);
          }
          const json = await res.json();
          setOrders(Array.isArray(json.orders) ? json.orders : []);
        } catch (e: any) {
          setError(e?.message || 'Не удалось получить заказы рядом');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        setError(err.message || 'Не удалось получить ваше местоположение');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const filteredOrders = orders.filter((o) =>
    !selectedMediaType || o.mediaType === selectedMediaType
  );

  return (
    <div>
      {/* Map Container */}
      <div className="h-64 bg-gradient-to-br from-panel to-bg-primary relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-2 border-text-muted/30 flex items-center justify-center mb-2">
              <span className="text-2xl">Map</span>
            </div>
            <p className="text-text-muted text-sm">{t('map.interactive')}</p>
            <p className="text-xs text-text-muted">{t('map.mapboxIntegration')}</p>
          </div>
        </div>
        {/* Mock map pins */}
        <div className="absolute top-16 left-20">
          <div className="w-4 h-4 bg-brand-primary rounded-full animate-pulse shadow-lg shadow-brand-primary/50"></div>
        </div>
        <div className="absolute top-24 right-16">
          <div className="w-4 h-4 bg-brand-accent rounded-full animate-pulse shadow-lg shadow-brand-accent/50"></div>
        </div>
        <div className="absolute bottom-16 left-1/3">
          <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50"></div>
        </div>
      </div>
      {/* Map Controls */}
      <div className="p-4 bg-panel/50">
        <div className="flex items-center justify-between">
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
                <div key={o.id} className="p-3 bg-panel rounded border border-white/10">
                  <div className="text-sm font-medium">{o.title}</div>
                  <div className="text-xs text-text-muted">{o.mediaType} • {o.location?.address || `${o.location?.lat}, ${o.location?.lng}`}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
