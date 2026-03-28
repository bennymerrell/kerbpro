import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

function createSightingIcon() {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 30px; height: 30px; border-radius: 50%;
      background: hsl(210, 80%, 42%);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
    ">ℹ️</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export default function SpeciesMarkers({ sightings, onRemove }) {
  return sightings.map((s, i) => (
    <Marker
      key={`sighting-${i}-${s.lat}-${s.lng}`}
      position={[s.lat, s.lng]}
      icon={createSightingIcon()}
    >
      <Popup closeButton={false}>
        <div className="font-sans text-sm p-1">
          <div className="font-semibold text-foreground mb-1">ℹ️ {s.species}</div>
          {s.notes && <div className="text-xs text-muted-foreground mb-1">{s.notes}</div>}
          <div className="text-xs text-muted-foreground">
            {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
          </div>
          <button
            onClick={() => onRemove(i)}
            className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            Remove
          </button>
        </div>
      </Popup>
    </Marker>
  ));
}