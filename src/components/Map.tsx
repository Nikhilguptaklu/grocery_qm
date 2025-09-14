import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapProps {
  onLocationSelect: (coordinates: [number, number], address?: string) => void;
  initialCoordinates?: [number, number];
}

const Map: React.FC<MapProps> = ({ onLocationSelect, initialCoordinates }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCoordinates || [-74.5, 40], // Default to NYC area
      zoom: 13,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add marker
    marker.current = new mapboxgl.Marker({
      draggable: true,
      color: '#3B82F6'
    })
      .setLngLat(initialCoordinates || [-74.5, 40])
      .addTo(map.current);

    // Handle marker drag
    marker.current.on('dragend', () => {
      if (marker.current) {
        const lngLat = marker.current.getLngLat();
        onLocationSelect([lngLat.lng, lngLat.lat]);
        reverseGeocode([lngLat.lng, lngLat.lat]);
      }
    });

    // Handle map click
    map.current.on('click', (e) => {
      const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      if (marker.current) {
        marker.current.setLngLat(coordinates);
      }
      onLocationSelect(coordinates);
      reverseGeocode(coordinates);
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, initialCoordinates, onLocationSelect]);

  const reverseGeocode = async (coordinates: [number, number]) => {
    if (!mapboxToken) return;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${mapboxToken}&types=address`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        onLocationSelect(coordinates, feature.place_name);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const updateLocation = (coordinates: [number, number]) => {
    if (map.current && marker.current) {
      map.current.setCenter(coordinates);
      marker.current.setLngLat(coordinates);
      onLocationSelect(coordinates);
      reverseGeocode(coordinates);
    }
  };

  // Expose updateLocation function to parent
  useEffect(() => {
    (window as any).updateMapLocation = updateLocation;
  }, []);

  if (!mapboxToken) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex flex-col items-center justify-center p-6">
        <h3 className="text-lg font-semibold mb-2">Map Integration</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          To use the map feature, please enter your Mapbox public token:
        </p>
        <div className="w-full max-w-md space-y-2">
          <input
            type="text"
            placeholder="Enter Mapbox public token"
            className="w-full px-3 py-2 border rounded-md"
            onChange={(e) => setMapboxToken(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Get your token at{' '}
            <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              mapbox.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 relative">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-sm border" />
      <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1">
        <p className="text-xs text-muted-foreground">Click or drag marker to select location</p>
      </div>
    </div>
  );
};

export default Map;