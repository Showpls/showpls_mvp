import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

    // Initialize map
    useEffect(() => {
        if (mapContainerRef.current && !isMapInitialized) {
            try {
                const center: [number, number] = selectedLocation
                    ? [selectedLocation.lng, selectedLocation.lat]
                    : [37.6176, 55.7558]; // Moscow default

                const map = mapService.initializeMap(mapContainerRef.current, center, 12);
                if (map) {
                    setIsMapInitialized(true);
                    console.log('[LOCATION_PICKER] Map initialized successfully');

                    // Add click handler to map
                    map.on('click', async (e) => {
                        const { lng, lat } = e.lngLat;
                        setIsLoading(true);

                        try {
                            const address = await locationService.getAddressFromCoordinates(lat, lng);
                            const newLocation = { lat, lng, address };
                            setSelectedLocation(newLocation);

                            // Add marker for selected location
                            mapService.clearMarkers();
                            mapService.addLocationMarker(lat, lng);

                            console.log('[LOCATION_PICKER] Location selected:', newLocation);
                        } catch (error) {
                            console.error('[LOCATION_PICKER] Error getting address:', error);
                            const newLocation = { lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
                            setSelectedLocation(newLocation);
                        } finally {
                            setIsLoading(false);
                        }
                    });

                    // Add initial marker if location exists
                    if (selectedLocation) {
                        mapService.addLocationMarker(selectedLocation.lat, selectedLocation.lng);
                    }
                }
            } catch (error) {
                console.error('[LOCATION_PICKER] Failed to initialize map:', error);
            }
        }

        return () => {
            if (isMapInitialized) {
                mapService.destroy();
                setIsMapInitialized(false);
            }
        };
    }, [isMapInitialized, selectedLocation]);

    // Get current location
    const getCurrentLocation = async () => {
        setIsLoading(true);
        try {
            const location = await locationService.getCurrentLocation();
            const address = await locationService.getAddressFromCoordinates(location.latitude, location.longitude);

            const newLocation = { lat: location.latitude, lng: location.longitude, address };
            setSelectedLocation(newLocation);

            // Update map center and marker
            if (mapService.map) {
                mapService.setCenter(location.longitude, location.latitude);
                mapService.setZoom(15);
                mapService.clearMarkers();
                mapService.addLocationMarker(location.latitude, location.longitude);
            }

            console.log('[LOCATION_PICKER] Current location set:', newLocation);
        } catch (error: any) {
            console.error('[LOCATION_PICKER] Error getting current location:', error);
            alert(error.message || 'Failed to get current location');
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
        <Card className={`w-full max-w-4xl mx-auto ${className}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        {t('location.pickLocation') || 'Pick Location'}
                    </CardTitle>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onClose}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Instructions */}
                <div className="text-sm text-gray-600">
                    {t('location.clickMap') || 'Click anywhere on the map to select a location, or use your current location.'}
                </div>

                {/* Map Container */}
                <div
                    ref={mapContainerRef}
                    className="w-full h-96 rounded-lg overflow-hidden border"
                    style={{ minHeight: '400px' }}
                />

                {/* Controls */}
                <div className="flex items-center justify-between">
                    <Button
                        onClick={getCurrentLocation}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                    >
                        <Crosshair className="w-4 h-4 mr-2" />
                        {isLoading ? (t('location.gettingLocation') || 'Getting Location...') : (t('location.useCurrent') || 'Use Current Location')}
                    </Button>

                    {selectedLocation && (
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                                {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                            </Badge>
                            <Button
                                onClick={handleConfirm}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                {t('location.confirm') || 'Confirm Location'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Selected Location Display */}
                {selectedLocation && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium mb-1">
                            {t('location.selectedAddress') || 'Selected Address'}:
                        </div>
                        <div className="text-sm text-gray-600">
                            {selectedLocation.address}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
