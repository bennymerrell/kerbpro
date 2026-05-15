import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CATEGORY_COLORS = {
  'Species': '#16a34a',
  'Free Parking': '#2563eb',
  'Hydrant': '#ea580c',
  'WO Point': '#0284c7',
  'Public Toilet': '#ea580c',
  'Cafe / Van': '#dc2626',
};

function createCategoryMarker(category, color) {
  const html = `
    <div style="
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: ${color};
      border: 2px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      color: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">
      ${
        category === 'Species' ? '🌿' :
        category === 'Free Parking' ? '🅿️' :
        category === 'Hydrant' ? '💧' :
        category === 'WO Point' ? '📍' :
        category === 'Public Toilet' ? '🚻' :
        category === 'Cafe / Van' ? '☕' :
        '📍'
      }
    </div>
  `;
  return L.divIcon({
    html,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    className: 'category-marker',
  });
}

export function SightingThumbnail({ sighting, clickable = true }) {
  const navigate = useNavigate();
  
  if (!sighting?.lat || !sighting?.lng) {
    return <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">No location</div>;
  }

  const cat = sighting.species?.match(/^\[(.+?)\]/)?.[1] || 'Species';
  const color = CATEGORY_COLORS[cat] || '#6b7280';

  const handleClick = () => {
    if (clickable) {
      navigate('/', { state: { flyTo: [sighting.lat, sighting.lng] } });
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`w-24 h-24 rounded-lg overflow-hidden border border-border ${clickable ? 'cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all' : ''}`}
    >
      <MapContainer center={[sighting.lat, sighting.lng]} zoom={16} className="w-full h-full" zoomControl={false} dragging={false} scrollWheelZoom={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        <Marker position={[sighting.lat, sighting.lng]} icon={createCategoryMarker(cat, color)} />
      </MapContainer>
    </div>
  );
}

export function CellThumbnail({ cell, clickable = true }) {
  const navigate = useNavigate();

  if (!cell?.points) {
    return <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">No shape</div>;
  }

  let points = [];
  try {
    points = JSON.parse(cell.points);
  } catch {
    return <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">Invalid shape</div>;
  }

  if (points.length === 0) {
    return <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">Empty shape</div>;
  }

  // Calculate center and bounds
  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
  const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;

  const handleClick = () => {
    if (clickable) {
      const bounds = points.map(p => [p.lat, p.lng]);
      navigate('/', { state: { fitBounds: bounds } });
    }
  };

  const polylineColor = cell.work_status === 'completed' ? '#22c55e' : cell.work_status === 'in_progress' ? '#f97316' : '#3b82f6';

  return (
    <div
      onClick={handleClick}
      className={`w-24 h-24 rounded-lg overflow-hidden border border-border ${clickable ? 'cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all' : ''}`}
    >
      <MapContainer center={[centerLat, centerLng]} zoom={14} className="w-full h-full" zoomControl={false} dragging={false} scrollWheelZoom={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        <Polygon positions={points.map(p => [p.lat, p.lng])} color={polylineColor} weight={2} opacity={0.8} fill fillColor={polylineColor} fillOpacity={0.2} />
      </MapContainer>
    </div>
  );
}