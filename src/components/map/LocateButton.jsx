import { useState, useEffect, useRef } from 'react';
import { LocateFixed, Loader2 } from 'lucide-react';
import { useMap, Marker, Circle, Popup } from 'react-leaflet';

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

function LocationMarker({ position, accuracy }) {
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
            <div className="text-muted-foreground font-medium">Your location</div>
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
    <div
      className="absolute z-[1000]"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)', right: '4.75rem' }}
    >
      <button
        onClick={handleCenterOnMe}
        disabled={loading}
        title="Centre on my location"
        className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-xl shadow-md flex items-center justify-center hover:bg-white transition-all disabled:opacity-60 md:w-auto md:h-auto md:rounded-xl md:p-2.5 md:bg-card/95 md:border md:border-border/50"
      >
        {loading
          ? <Loader2 className="h-5 w-5 text-foreground animate-spin md:h-4 md:w-4" />
          : <LocateFixed className={`h-5 w-5 md:h-4 md:w-4 ${locationData?.position ? 'text-blue-600' : 'text-gray-700'}`} />
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
        />
      )}
    </>
  );
}