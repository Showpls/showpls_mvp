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
    const [isLoading, setIsLoading] = useState(false); // For 'Use Current Location'
    const [isGeocoding, setIsGeocoding] = useState(false); // For reverse geocoding on map click

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
                    const handleMapClick = async (e: mapboxgl.MapMouseEvent & {
                        lngLat: mapboxgl.LngLat;
                    }) => {
                        const { lng, lat } = e.lngLat;

                        // --- Immediate UI Update ---
                        // 1. Set location with placeholder text for address
                        setSelectedLocation({ lat, lng, address: 'Загрузка адреса...' });

                        // 2. Immediately place marker on the map
                        mapService.clearMarkers();
                        mapService.addLocationMarker(lat, lng);
                        // --- End Immediate UI Update ---

                        // Fetch address asynchronously
                        setIsGeocoding(true);
                        try {
                            const address = await locationService.getAddressFromCoordinates(lat, lng);
                            setSelectedLocation({ lat, lng, address }); // Update with real address
                            console.log('[LOCATION_PICKER] Location selected from map:', { lat, lng, address });
                        } catch (error) {
                            console.error('[LOCATION_PICKER] Error getting address from coords:', error);
                            setSelectedLocation({ lat, lng, address: 'Не удалось определить адрес' });
                        } finally {
                            setIsGeocoding(false);
                        }
                    };

                    map.on('click', handleMapClick);

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
            mapService.setCenter(location.longitude, location.latitude);
            mapService.setZoom(15);
            mapService.clearMarkers();
            mapService.addLocationMarker(location.latitude, location.longitude);

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
        <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 p-2 ${className}`}>
            <div className="h-full flex flex-col bg-white rounded-t-2xl mt-8 overflow-hidden">
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        {t('location.pickLocation') || 'Выберите место'}
                    </h2>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onClose}
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Instructions */}
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                    <div className="text-sm text-blue-800">
                        {t('location.clickMap') || 'Нажмите на карту для выбора места или используйте текущее местоположение'}
                    </div>
                </div>

                {/* Map Container - Takes remaining space */}
                <div className="flex-1 relative">
                    <div
                        ref={mapContainerRef}
                        className="w-full h-full"
                    />
                    
                    {/* Loading overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <div className="bg-white p-4 rounded-lg shadow-lg">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                <p className="text-sm mt-2 text-gray-700">Получение местоположения...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Controls Panel */}
                <div className="bg-white border-t border-gray-200 p-4 space-y-3">
                    {/* Current Location Button */}
                    <Button
                        onClick={getCurrentLocation}
                        disabled={isLoading}
                        variant="outline"
                        className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    >
                        <Crosshair className="w-4 h-4 mr-2" />
                        {isLoading ? 'Получение местоположения...' : 'Использовать текущее место'}
                    </Button>

                    {/* Selected Location Info */}
                    {selectedLocation && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="text-sm font-medium text-gray-900 mb-1 flex items-center">
                                Выбранный адрес:
                                {isGeocoding && (
                                    <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                )}
                            </div>
                            <div className="text-sm text-gray-700 mb-2 min-h-[20px]">
                                {selectedLocation.address}
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                    {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                                </div>
                                <Button
                                    onClick={handleConfirm}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Check className="w-4 h-4 mr-1" />
                                    Подтвердить
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
