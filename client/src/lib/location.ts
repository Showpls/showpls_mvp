import { locationManager } from '@telegram-apps/sdk';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export class LocationService {
  private isTelegramSupported: boolean = false;
  private isTelegramMounted: boolean = false;

  constructor() {
    this.isTelegramSupported = locationManager.isSupported();
  }

  async initialize(): Promise<void> {
    if (this.isTelegramSupported) {
      try {
        await locationManager.mount();
        this.isTelegramMounted = true;
        console.log('[LOCATION] Telegram location manager mounted successfully');
      } catch (error) {
        console.error('[LOCATION] Failed to mount Telegram location manager:', error);
        this.isTelegramMounted = false;
      }
    }
  }

  async getCurrentLocation(): Promise<LocationData> {
    try {
      // Try Telegram first if available
      if (this.isTelegramSupported && this.isTelegramMounted) {
        console.log('[LOCATION] Using Telegram location manager');
        const location = await locationManager.requestLocation();
        console.log('[LOCATION] Telegram location received:', location);
        
        return {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.horizontal_accuracy,
        };
      }

      // Fall back to browser geolocation
      if (navigator.geolocation) {
        console.log('[LOCATION] Using browser geolocation API');
        return await this.getBrowserLocation();
      }

      throw new Error('Geolocation not supported by this browser');
    } catch (error: any) {
      console.error('[LOCATION] Location error:', error);
      throw this.formatLocationError(error);
    }
  }

  private getBrowserLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          reject(this.formatGeolocationError(error));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }

  private formatGeolocationError(error: GeolocationPositionError): Error {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return new Error('Location access denied. Please allow access in settings.');
      case error.POSITION_UNAVAILABLE:
        return new Error('Location information is unavailable.');
      case error.TIMEOUT:
        return new Error('Location request timed out.');
      default:
        return new Error('Failed to get your location.');
    }
  }

  private formatLocationError(error: any): Error {
    if (error?.message?.includes('denied') || error?.message?.includes('permission')) {
      return new Error('Location access denied. Please allow access in settings.');
    } else if (error?.message?.includes('timeout')) {
      return new Error('Location request timed out.');
    } else if (error?.message?.includes('unavailable')) {
      return new Error('Location information is unavailable.');
    } else if (error?.message?.includes('not supported')) {
      return new Error('Geolocation not supported by this browser.');
    } else {
      return new Error(error?.message || 'Failed to get your location.');
    }
  }

  async getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}&types=place,address`
      );
      
      if (!response.ok) {
        throw new Error('Failed to get address');
      }

      const data = await response.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }

      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('[LOCATION] Failed to get address:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  destroy(): void {
    if (this.isTelegramMounted) {
      try {
        locationManager.unmount();
        this.isTelegramMounted = false;
        console.log('[LOCATION] Telegram location manager unmounted');
      } catch (error) {
        console.error('[LOCATION] Error unmounting Telegram location manager:', error);
      }
    }
  }
}

// Create singleton instance
export const locationService = new LocationService();
