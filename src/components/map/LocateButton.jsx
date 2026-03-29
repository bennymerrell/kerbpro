import { useState, useEffect, useRef } from 'react';
import { LocateFixed, Loader2 } from 'lucide-react';
import { useMap, Marker, Circle, Popup } from 'react-leaflet';
import { coordsToW3W } from '../../lib/w3wUtils';
import L from 'leaflet';

// Inject pulsing animation style once
if (typeof document !== 'undefined' && !document.getElementById('pulse-style')) {
  const style = document.createElement('style');
  style.id = 'pulse-style';
  style.textContent = `
    @keyframes locationPulse {
      0% { transform: scale(1); opacity: 0.8; }
      70% { transform: scale(2.5); opacity: 0; }
      100% { transform: scale(1); opacity: 0; }
    }
    .location-dot-pulse {
      position: relative;
      width: 16px; height: 16px;
    }
    .location-dot-pulse::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: #2563eb;
      animation: locationPulse 2s ease-out infinite;
    }
    .location-dot-inner {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: #2563eb;
      border: 2.5px solid white;
      box-shadow: 0 2px 8px rgba(37,99,235,0.5);
    }
  `;
  document.head.appendChild(style);
}

function createLocationIcon() {
  return L.divIcon({
    className: '',
    html: `<div class="location-dot-pulse"><div class="location-dot-inner"></div></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function LocationMarker({ position, accuracy, w3w }) {
  if (!position) return null;
  return (
    <>
      <Circle
        center={position}
        radius={accuracy}
        pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.08, weight: 1 }}
      />
      <Marker position={position} icon={createLocationIcon()}>
        <Popup closeButton={false}>
          <div className="font-sans text-xs p-1">
            <div className="text-muted-foreground mb-0.5 font-medium">Your location</div>
            {w3w && (
              <a
                href={`https://what3words.com/${w3w.replace('///', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#e11d48] font-semibold hover:underline text-sm"
              >
                {w3w}
              </a>
            )}
          </div>
        </Popup>
      </Marker>
    </>
  );
}

function LocateControl({ locationData, onLocationUpdate }) {
  const map = useMap();
  const [loading, setLoading] = useState(false);
  const watchRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    // Start continuous tracking
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          const latlng = [pos.coords.latitude, pos.coords.longitude];
          setLoading(false);
          onLocationUpdate(prev => ({
            ...prev,
            position: latlng,
            accuracy: pos.coords.accuracy,
          }));
          // Fetch W3W once
          const w3w = await coordsToW3W(pos.coords.latitude, pos.coords.longitude);
          onLocationUpdate(p => ({ ...p, w3w }));
        } catch (e) {
          console.error('Location update error:', e);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );

    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [onLocationUpdate]);

  function handleCenterOnMe() {
    if (locationData?.position) {
      map.flyTo(locationData.position, Math.max(map.getZoom(), 16), { duration: 1.2 });
    } else {
      setLoading(true);
    }
  }

  return (
    <div className="absolute z-[1000] top-16 right-4 md:right-5">
      <button
        onClick={handleCenterOnMe}
        disabled={loading}
        title="Centre on my location"
        className="bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-2.5 hover:bg-muted/80 transition-all disabled:opacity-60"
      >
        {loading
          ? <Loader2 className="h-4 w-4 text-foreground animate-spin" />
          : <LocateFixed className={`h-4 w-4 ${locationData?.position ? 'text-blue-600' : 'text-foreground'}`} />
        }
      </button>
    </div>
  );
}

export default function LocateButton() {
  const [locationData, setLocationData] = useState(null);
  return (
    <>
      <LocateControl locationData={locationData} onLocationUpdate={setLocationData} />
      {locationData?.position && (
        <LocationMarker
          position={locationData.position}
          accuracy={locationData.accuracy}
          w3w={locationData.w3w}
        />
      )}
    </>
  );
}