import mapboxgl from 'mapbox-gl';

// Mapbox configuration
export const MAPBOX_CONFIG = {
  accessToken: (() => {
    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    console.log('[MAPBOX] Environment check:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPrefix: token?.substring(0, 8) || 'none',
      isPlaceholder: token === 'your_mapbox_access_token_here'
    });
    
    if (!token || token === 'your_mapbox_access_token_here') {
      console.error('[MAPBOX] No valid access token found. Please set VITE_MAPBOX_ACCESS_TOKEN in your environment variables.');
      console.error('[MAPBOX] Current token value:', token);
      return null;
    }
    return token;
  })(),
  style: 'mapbox://styles/mapbox/dark-v11',
  clusterRadius: 50,
  maxZoom: 16,
};

// Map service class
export class MapService {
  private map: mapboxgl.Map | null = null;
  private markers: mapboxgl.Marker[] = [];
  private clusters: any = null;

  constructor() {
    if (!MAPBOX_CONFIG.accessToken) {
      console.error('[MAPBOX] Cannot initialize map without access token');
      return;
    }
    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;
  }

  // Initialize map
  initializeMap(container: string | HTMLElement, center: [number, number] = [37.6176, 55.7558], zoom: number = 10) {
    if (!MAPBOX_CONFIG.accessToken) {
      console.error('[MAPBOX] Cannot initialize map without access token');
      return null;
    }

    if (this.map) {
      this.map.remove();
    }

    try {
      this.map = new mapboxgl.Map({
        container: container,
        style: MAPBOX_CONFIG.style,
        center: center,
        zoom: zoom,
        maxZoom: MAPBOX_CONFIG.maxZoom,
        attributionControl: false,
      });
    } catch (error) {
      console.error('[MAPBOX] Failed to initialize map:', error);
      return null;
    }

    // Add navigation controls
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geolocate control
    this.map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    );

    return this.map;
  }

  // Add markers for orders
  addOrderMarkers(orders: any[], currentUser?: any, onMarkerClick?: (order: any) => void, isClickable: boolean = true) {
    if (!this.map) return;

    // Clear existing markers
    this.clearMarkers();

    orders.forEach((order) => {
      if (order.location?.lat && order.location?.lng) {
        // Create marker element
        const el = document.createElement('div');
        el.className = 'order-marker';
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.borderRadius = '50%';
        el.style.background = this.getMarkerColor(order.mediaType);
        el.style.border = '2px solid var(--background)';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';

        // Add icon based on media type
        const icon = document.createElement('div');
        icon.innerHTML = this.getMarkerIcon(order.mediaType);
        icon.style.fontSize = '14px';
        icon.style.color = 'var(--primary-foreground)';
        el.appendChild(icon);

        // Create marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat([order.location.lng, order.location.lat])
          .addTo(this.map!);

        // Add popup
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          this.createPopupHTML(order, currentUser)
        );

        if (isClickable) {
          marker.setPopup(popup);

          // Add click handler
          if (onMarkerClick) {
            el.addEventListener('click', () => onMarkerClick(order));
          }
        }

        this.markers.push(marker);
      }
    });
  }

  // Get marker color based on media type
  private getMarkerColor(mediaType: string): string {
    switch (mediaType) {
      case 'photo':
        return '#3b82f6'; // blue
      case 'video':
        return '#ef4444'; // red
      case 'live':
        return '#10b981'; // green
      default:
        return '#6b7280'; // gray
    }
  }

  // Get marker icon based on media type
  private getMarkerIcon(mediaType: string): string {
    switch (mediaType) {
      case 'photo':
        return '📷';
      case 'video':
        return '🎥';
      case 'live':
        return '📡';
      default:
        return '📍';
    }
  }

  // Create popup HTML
  private createPopupHTML(order: any, currentUser?: any): string {
    const canAccept = currentUser && 
                     currentUser.id !== order.requesterId && 
                     (order.status === 'CREATED' || order.status === 'FUNDED');
    
    const acceptButton = canAccept ? `
      <button 
        onclick="window.acceptOrder('${order.id}')" 
        style="
          background: #3b82f6; 
          color: var(--primary-foreground); 
          border: none; 
          padding: 8px 16px; 
          border-radius: 6px; 
          cursor: pointer; 
          font-size: 12px; 
          margin-top: 8px; 
          width: 100%;
        "
      >
        Accept Order
      </button>
    ` : '';

    return `
      <div style="min-width: 200px; font-family: system-ui, sans-serif;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${order.title}</h3>
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">${order.description?.substring(0, 100)}${order.description?.length > 100 ? '...' : ''}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-bottom: 8px;">
          <span style="background: ${this.getMarkerColor(order.mediaType)}; color: var(--primary-foreground); padding: 2px 8px; border-radius: 12px;">
            ${order.mediaType}
          </span>
          <span style="font-weight: 600; color: #059669;">${this.formatTON(order.budgetNanoTon)}</span>
        </div>
        <div style="font-size: 11px; color: #666; margin-bottom: 8px;">
          Status: ${order.status}
        </div>
        ${acceptButton}
      </div>
    `;
  }

  // Format TON amount
  private formatTON(nanoTon: string): string {
    const ton = parseInt(nanoTon) / 1e9;
    return `${ton} TON`;
  }

  // Clear all markers
  clearMarkers() {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  // Add a single location marker (for location picker)
  addLocationMarker(lat: number, lng: number) {
    if (!this.map) return;

    // Create marker element
    const el = document.createElement('div');
    el.className = 'location-marker';
    el.style.width = '24px';
    el.style.height = '24px';
    el.style.borderRadius = '50%';
    el.style.background = '#ef4444'; // Red color for location picker
    el.style.border = '3px solid var(--background)';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';

    // Add pin icon
    const icon = document.createElement('div');
    icon.innerHTML = '📍';
    icon.style.fontSize = '12px';
    el.appendChild(icon);

    // Create marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(this.map!);

    this.markers.push(marker);
  }

  // Set map center
  setCenter(lng: number, lat: number) {
    if (this.map) {
      this.map.setCenter([lng, lat]);
    }
  }

  // Set map zoom
  setZoom(zoom: number) {
    if (this.map) {
      this.map.setZoom(zoom);
    }
  }

  // Fit bounds to include all markers
  fitBounds() {
    if (!this.map || this.markers.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    this.markers.forEach(marker => {
      bounds.extend(marker.getLngLat());
    });

    this.map.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
    });
  }

  // Get current map center
  getCenter(): [number, number] | null {
    if (!this.map) return null;
    const center = this.map.getCenter();
    return [center.lng, center.lat];
  }

  // Get current map zoom
  getZoom(): number | null {
    if (!this.map) return null;
    return this.map.getZoom();
  }

  // Destroy map
  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.clearMarkers();
  }
}

// Create singleton instance
export const mapService = new MapService();

// Utility functions
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const filterOrdersByRadius = (orders: any[], centerLat: number, centerLng: number, radiusKm: number) => {
  return orders.filter(order => {
    if (!order.location?.lat || !order.location?.lng) return false;
    const distance = calculateDistance(centerLat, centerLng, order.location.lat, order.location.lng);
    return distance <= radiusKm;
  });
};

export const filterOrdersByType = (orders: any[], mediaType: string) => {
  if (!mediaType) return orders;
  return orders.filter(order => order.mediaType === mediaType);
};

export const filterOrdersByBudget = (orders: any[], minBudget: number, maxBudget: number) => {
  return orders.filter(order => {
    const budget = parseInt(order.budgetNanoTon) / 1e9;
    return budget >= minBudget && budget <= maxBudget;
  });
};
