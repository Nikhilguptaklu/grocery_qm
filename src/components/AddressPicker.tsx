import { useEffect, useMemo, useRef, useState } from 'react';
import L, { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon paths for Leaflet in bundlers (Vite)
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon as any;

type AddressPickerProps = {
  onSave: (data: { lat: number; lon: number; address: string }) => void;
  initial?: { lat: number; lon: number; address?: string };
};

export default function AddressPicker({ onSave, initial }: AddressPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [address, setAddress] = useState(initial?.address || '');
  const [coords, setCoords] = useState<{ lat: number; lon: number }>(
    initial ? { lat: initial.lat, lon: initial.lon } : { lat: 28.6139, lon: 77.2090 } // Default: New Delhi
  );
  const [loading, setLoading] = useState(false);

  const nominatimBase = useMemo(() => 'https://nominatim.openstreetmap.org', []);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [coords.lat, coords.lon],
      zoom: 14,
      zoomControl: true,
      attributionControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker([coords.lat, coords.lon], { draggable: true }).addTo(map);

    marker.on('dragend', async () => {
      try {
        const pos = marker.getLatLng();
        if (!pos) return;
        const { lat, lng } = pos as any;
        setCoords({ lat, lon: lng });
        setLoading(true);
        try {
          const url = `${nominatimBase}/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
          const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
          const data = await res.json();
          setAddress(data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
          setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } finally {
          setLoading(false);
        }
      } catch (err) {
        // swallow leaflet errors
        console.warn('Leaflet dragend handler error', err);
      }
    });

    // When user pans the map, keep the marker at the center for a "pin-center" UX
    map.on('move', () => {
      try {
        const center = map.getCenter();
        if (!center || !marker) return;
        marker.setLatLng(center);
      } catch (err) {
        console.warn('Leaflet move handler error', err);
      }
    });

    // On pan end, update coords and reverse geocode
    map.on('moveend', async () => {
      try {
        const c = map.getCenter();
        if (!c) return;
        setCoords({ lat: c.lat, lon: c.lng });
        setLoading(true);
        try {
          const url = `${nominatimBase}/reverse?format=jsonv2&lat=${c.lat}&lon=${c.lng}`;
          const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
          const data = await res.json();
          setAddress(data?.display_name || `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`);
        } catch {
          setAddress(`${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`);
        } finally {
          setLoading(false);
        }
      } catch (err) {
        console.warn('Leaflet moveend handler error', err);
      }
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [containerRef, coords.lat, coords.lon, nominatimBase]);

  // Helper to move marker and map
  const moveTo = async (lat: number, lon: number, doReverse = true) => {
    if (!mapRef.current || !markerRef.current) {
      console.warn('Leaflet map or marker not initialized yet');
      return;
    }
    try {
      markerRef.current.setLatLng([lat, lon]);
      mapRef.current.setView([lat, lon], 16);
    } catch (err) {
      console.warn('Error moving map/marker', err);
      return;
    }
    setCoords({ lat, lon });
    if (doReverse) {
      setLoading(true);
      try {
        const url = `${nominatimBase}/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        setAddress(data?.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`);
      } catch {
        setAddress(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const url = `${nominatimBase}/search?format=jsonv2&q=${encodeURIComponent(searchQuery)}&limit=5`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'FlashMart/1.0' } } as any);
      const results: any[] = await res.json();
      if (results && results.length > 0) {
        const best = results[0];
        await moveTo(parseFloat(best.lat), parseFloat(best.lon), false);
        setAddress(best.display_name || searchQuery);
      }
    } finally {
      setLoading(false);
    }
  };

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setAddress('Geolocation is not supported on this device.');
      return;
    }
    if (window.isSecureContext === false) {
      setAddress('Location requires HTTPS. Please use a secure connection.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      await moveTo(latitude, longitude, true);
      setLoading(false);
    }, (err) => {
      setLoading(false);
      setAddress(err?.message || 'Unable to fetch current location. Please allow permission in browser.');
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };

  return (
    <div className="space-y-3">
      <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search address"
          className="w-full sm:flex-1 border rounded px-3 py-2 text-sm"
        />
        <div className="flex gap-2 sm:w-auto w-full">
          <button type="submit" disabled={loading} className="border rounded px-3 py-2 text-sm w-full sm:w-auto disabled:opacity-60">Search</button>
          <button type="button" onClick={useMyLocation} disabled={loading} className="border rounded px-3 py-2 text-sm w-full sm:w-auto disabled:opacity-60">Use My Location</button>
        </div>
      </form>

      <div
        ref={containerRef}
        style={{ height: 300, width: '100%', borderRadius: 12, overflow: 'hidden' }}
        className="border"
      />

      <div className="text-sm text-muted-foreground min-h-[1.5rem] break-words">
        {loading ? 'Fetching address…' : address || 'Pick a location'}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onSave({ lat: coords.lat, lon: coords.lon, address })}
          className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm w-full sm:w-auto"
        >
          Save Address
        </button>
      </div>
    </div>
  );
}


