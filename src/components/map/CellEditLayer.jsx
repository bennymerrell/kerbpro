import { Marker, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

function nearestSegmentIndex(points, lat, lng) {
  let best = 0, bestDist = Infinity;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    // project click onto segment ab
    const dx = b.lng - a.lng, dy = b.lat - a.lat;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq > 0 ? ((lng - a.lng) * dx + (lat - a.lat) * dy) / lenSq : 0;
    t = Math.max(0, Math.min(1, t));
    const px = a.lng + t * dx, py = a.lat + t * dy;
    const dist = (lng - px) ** 2 + (lat - py) ** 2;
    if (dist < bestDist) { bestDist = dist; best = i; }
  }
  return best;
}

function makePointIcon(index) {
  const isFirst = index === 0;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${isFirst ? 16 : 12}px;height:${isFirst ? 16 : 12}px;
      border-radius:50%;
      background:${isFirst ? '#f59e0b' : '#6366f1'};
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
      cursor:grab;
    "></div>`,
    iconSize: [isFirst ? 16 : 12, isFirst ? 16 : 12],
    iconAnchor: [isFirst ? 8 : 6, isFirst ? 8 : 6],
  });
}

function MapClickInsert({ points, onChange }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      const idx = nearestSegmentIndex(points, lat, lng);
      const updated = [...points];
      updated.splice(idx + 1, 0, { lat, lng });
      onChange(updated);
    }
  });
  return null;
}

export default function CellEditLayer({ points, onChange }) {
  const positions = points.map(p => [p.lat, p.lng]);

  function handleDragEnd(index, e) {
    const { lat, lng } = e.target.getLatLng();
    const updated = points.map((p, i) => i === index ? { lat, lng } : p);
    onChange(updated);
  }

  function handleRemove(index) {
    if (points.length <= 3) return;
    onChange(points.filter((_, i) => i !== index));
  }

  return (
    <>
      <MapClickInsert points={points} onChange={onChange} />
      <Polygon
        positions={positions}
        pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.15, weight: 2, dashArray: '6 4' }}
      />
      {points.map((p, i) => (
        <Marker
          key={i}
          position={[p.lat, p.lng]}
          icon={makePointIcon(i)}
          draggable
          eventHandlers={{
            dragend: (e) => handleDragEnd(i, e),
            click: () => handleRemove(i),
          }}
        />
      ))}
    </>
  );
}