import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const CATEGORY_ICONS = {
  'Species':       '🌿',
  'Parking':       '🅿️',
  'Hydrant':       '🚒',
  'Map Support':   '📍',
  'Public Toilet': '🚻',
  'Cafe':          '☕',
};

const CATEGORY_COLORS = {
  'Species':       '#16a34a',
  'Parking':       '#2563eb',
  'Hydrant':       '#dc2626',
  'Map Support':   '#7c3aed',
  'Public Toilet': '#d97706',
  'Cafe':          '#ea580c',
};

function createSightingIcon(category) {
  const emoji = CATEGORY_ICONS[category] || 'ℹ️';
  const color = CATEGORY_COLORS[category] || '#2563eb';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 34px; height: 34px; border-radius: 50%;
      background: ${color};
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 15px;
    ">${emoji}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

export default function SpeciesMarkers({ sightings, onRemove }) {
  return sightings.map((s, i) => {
    const category = s.species?.match(/^\[(.+?)\]/)?.[1] || 'Species';
    return (
    <Marker
      key={`sighting-${i}-${s.lat}-${s.lng}`}
      position={[s.lat, s.lng]}
      icon={createSightingIcon(category)}
    >
      <Popup closeButton={false}>
        <div className="font-sans text-sm p-1">
          <div className="font-semibold text-foreground mb-1">{CATEGORY_ICONS[category] || 'ℹ️'} {s.species?.replace(/^\[.+?\]\s*/, '')}</div>
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
  )});
}