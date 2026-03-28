import { useState } from 'react';
import { LocateFixed, Loader2 } from 'lucide-react';
import { useMap, Marker, Circle, Popup } from 'react-leaflet';
import { coordsToW3W } from '../../lib/w3wUtils';
import L from 'leaflet';

function createLocationIcon() {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 8px rgba(37,99,235,0.5);"></div>`,
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
        pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.1, weight: 1 }}
      />
      <Marker position={position} icon={createLocationIcon()}>
        {w3w && (
          <Popup closeButton={false}>
            <div className="font-sans text-xs p-1">
              <div className="text-muted-foreground mb-0.5 font-medium">Your location</div>
              <a
                href={`https://what3words.com/${w3w.replace('///', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#e11d48] font-semibold hover:underline text-sm"
              >
                {w3w}
              </a>
            </div>
          </Popup>
        )}
      </Marker>
    </>
  );
}

function LocateControl({ position, accuracy, onLocate }) {
  const map = useMap();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        map.flyTo(latlng, 16, { duration: 1.5 });
        const w3w = await coordsToW3W(pos.coords.latitude, pos.coords.longitude);
        onLocate({ position: latlng, accuracy: pos.coords.accuracy, w3w });
        setLoading(false);
      },
      () => {
        alert('Unable to retrieve your location. Please enable location permissions.');
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }

  return (
    <div className="absolute z-[1000]" style={{ top: '4rem', right: '1rem' }}>
      <button
        onClick={handleClick}
        disabled={loading}
        title="Show my location"
        className="bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-2.5 hover:bg-muted/80 transition-all disabled:opacity-60"
      >
        {loading
          ? <Loader2 className="h-4 w-4 text-foreground animate-spin" />
          : <LocateFixed className={`h-4 w-4 ${position ? 'text-blue-600' : 'text-foreground'}`} />
        }
      </button>
    </div>
  );
}

export default function LocateButton() {
  const [locationData, setLocationData] = useState(null);
  return (
    <>
      <LocateControl
        position={locationData?.position}
        accuracy={locationData?.accuracy}
        onLocate={setLocationData}
      />
      {locationData && (
        <LocationMarker position={locationData.position} accuracy={locationData.accuracy} w3w={locationData.w3w} />
      )}
    </>
  );
}