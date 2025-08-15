import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { MapPin, Crosshair, X, Check } from "lucide-react";
import { mapService } from "@/lib/map";
import { locationService } from "@/lib/location";
import 'mapbox-gl/dist/mapbox-gl.css';

interface LocationPickerProps {
    initialLocation?: { lat: number; lng: number; address?: string };
    onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
    onClose: () => void;
    className?: string;
}

export function LocationPicker({
    initialLocation,
    onLocationSelect,
    onClose,
    className = ""
}: LocationPickerProps) {
    const { t } = useTranslation();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [isMapInitialized, setIsMapInitialized] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(
        initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng, address: initialLocation.address || '' } : null
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);

    useEffect(() => {
        if (mapContainerRef.current && !isMapInitialized) {
            const center: [number, number] = selectedLocation
                ? [selectedLocation.lng, selectedLocation.lat]
                : [37.6176, 55.7558]; // Default to Moscow

            const map = mapService.initializeMap(mapContainerRef.current, center, 12);
            if (map) {
                setIsMapInitialized(true);

                const handleMapClick = async (e: mapboxgl.MapMouseEvent & { lngLat: mapboxgl.LngLat }) => {
                    const { lng, lat } = e.lngLat;
                    setSelectedLocation({ lat, lng, address: t('location.loadingAddress') });
                    mapService.clearMarkers();
                    mapService.addLocationMarker(lat, lng);

                    setIsGeocoding(true);
                    try {
                        const address = await locationService.getAddressFromCoordinates(lat, lng);
                        setSelectedLocation({ lat, lng, address });
                    } catch (error) {
                        console.error('[LOCATION_PICKER] Error getting address:', error);
                        setSelectedLocation({ lat, lng, address: t('location.addressError') });
                    } finally {
                        setIsGeocoding(false);
                    }
                };

                map.on('click', handleMapClick);

                if (selectedLocation) {
                    mapService.addLocationMarker(selectedLocation.lat, selectedLocation.lng);
                }
            }
        }

        return () => {
            if (isMapInitialized) {
                mapService.destroy();
                setIsMapInitialized(false);
            }
        };
    }, [isMapInitialized, selectedLocation, t]);

    const getCurrentLocation = async () => {
        setIsLoading(true);
        try {
            const location = await locationService.getCurrentLocation();
            const address = await locationService.getAddressFromCoordinates(location.latitude, location.longitude);
            const newLocation = { lat: location.latitude, lng: location.longitude, address };
            setSelectedLocation(newLocation);

            mapService.setCenter(location.longitude, location.latitude);
            mapService.setZoom(15);
            mapService.clearMarkers();
            mapService.addLocationMarker(location.latitude, location.longitude);
        } catch (error: any) {
            console.error('[LOCATION_PICKER] Error getting current location:', error);
            alert(error.message || t('location.getCurrentLocationError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = () => {
        if (selectedLocation) {
            onLocationSelect(selectedLocation);
            onClose();
        }
    };

    return (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col ${className}`}>
            {/* Header */}
            <div className="bg-background flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brand-primary" />
                    {t('location.pickLocation')}
                </h2>
                <Button size="icon" variant="ghost" onClick={onClose}>
                    <X className="w-5 h-5" />
                </Button>
            </div>

            {/* Instructions */}
            <div className="px-4 py-2 bg-background-secondary border-b border-border">
                <p className="text-sm text-text-secondary text-center">{t('location.clickMap')}</p>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
                <div ref={mapContainerRef} className="w-full h-full" />
                {(isLoading || isGeocoding) && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 bg-background p-4 rounded-lg shadow-lg">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                            <p className="text-sm text-text-secondary">
                                {isLoading ? t('location.gettingLocation') : t('location.loadingAddress')}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Controls Panel */}
            <div className="bg-background border-t border-border p-4 space-y-4">
                <Button
                    onClick={getCurrentLocation}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                >
                    <Crosshair className="w-4 h-4 mr-2" />
                    {t('location.useCurrentLocation')}
                </Button>

                {selectedLocation && (
                    <div className="p-3 bg-background-secondary rounded-lg border border-border text-left">
                        <p className="text-sm font-medium text-text-primary mb-1">{t('location.selectedAddress')}</p>
                        <p className="text-sm text-text-secondary min-h-[20px]">{selectedLocation.address}</p>
                        <p className="text-xs text-text-muted mt-1">
                            {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                        </p>
                    </div>
                )}

                <Button
                    onClick={handleConfirm}
                    disabled={!selectedLocation || isGeocoding}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                    <Check className="w-4 h-4 mr-2" />
                    {t('location.confirm')}
                </Button>
            </div>
        </div>
    );
}
