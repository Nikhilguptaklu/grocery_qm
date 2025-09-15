import React, { useEffect, useRef, useState } from 'react';

interface MappLsMapProps {
  onLocationSelect: (coordinates: [number, number], address?: string) => void;
  initialCoordinates?: [number, number];
  height?: string;
}

const MappLsMap: React.FC<MappLsMapProps> = ({ 
  onLocationSelect, 
  initialCoordinates,
  height = "h-64" 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Default coordinates (New Delhi, India)
  const defaultCoords = initialCoordinates || [77.2090, 28.6139];

  useEffect(() => {
    // Load Mappls script
    const script = document.createElement('script');
    script.src = 'https://apis.mappls.com/advancedmaps/api/71b7d04978f4e17d22a1e37e1c72535e/map_sdk?layer=vector&v=3.0&callback=initializeMap';
    script.async = true;
    
    // Initialize map callback
    (window as any).initializeMap = () => {
      setIsLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
      delete (window as any).initializeMap;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapContainer.current || map) return;

    try {
      // Initialize Mappls Map
      const mappLsMap = new (window as any).mappls.Map(mapContainer.current, {
        center: defaultCoords,
        zoom: 13,
        search: false,
        traffic: false,
        geolocation: false,
        clickableIcons: false
      });

      // Add marker
      const mappLsMarker = new (window as any).mappls.Marker({
        position: defaultCoords,
        map: mappLsMap,
        draggable: true
      });

      // Handle marker drag
      mappLsMarker.addListener('dragend', () => {
        const position = mappLsMarker.getPosition();
        const coords: [number, number] = [position.lng, position.lat];
        onLocationSelect(coords);
        reverseGeocode(coords);
      });

      // Handle map click
      mappLsMap.addListener('click', (e: any) => {
        const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        mappLsMarker.setPosition(coords);
        onLocationSelect(coords);
        reverseGeocode(coords);
      });

      setMap(mappLsMap);
      setMarker(mappLsMarker);
    } catch (error) {
      console.error('Error initializing Mappls map:', error);
    }
  }, [isLoaded, onLocationSelect]);

  const reverseGeocode = async (coordinates: [number, number]) => {
    try {
      const response = await fetch(
        `https://apis.mappls.com/advancedmaps/v1/71b7d04978f4e17d22a1e37e1c72535e/rev_geocode?lat=${coordinates[1]}&lng=${coordinates[0]}`
      );
      const data = await response.json();
      
      if (data && data.results && data.results.length > 0) {
        const result = data.results[0];
        const address = result.formatted_address || `${result.locality}, ${result.district}, ${result.state}`;
        onLocationSelect(coordinates, address);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const updateLocation = (coordinates: [number, number]) => {
    if (map && marker) {
      map.setCenter(coordinates);
      marker.setPosition(coordinates);
      onLocationSelect(coordinates);
      reverseGeocode(coordinates);
    }
  };

  // Expose updateLocation function to parent
  useEffect(() => {
    (window as any).updateMapLocation = updateLocation;
  }, [map, marker]);

  if (!isLoaded) {
    return (
      <div className={`w-full ${height} bg-muted rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${height} relative`}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-sm border" />
      <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1">
        <p className="text-xs text-muted-foreground">Click or drag marker to select location</p>
      </div>
    </div>
  );
};

export default MappLsMap;