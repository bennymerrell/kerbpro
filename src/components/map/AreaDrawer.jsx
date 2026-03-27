import { Polygon, Polyline, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

function dotIcon(color = '#6366f1') {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

export default function AreaDrawer({ points, closed, onClose }) {
  useMapEvents({
    dblclick(e) {
      e.originalEvent.preventDefault();
      if (points.length >= 3 && !closed) onClose();
    },
  });

  if (points.length === 0) return null;

  const positions = points.map(p => [p.lat, p.lng]);

  return (
    <>
      {closed ? (
        <Polygon
          positions={positions}
          pathOptions={{ color: '#6366f1', weight: 2.5, fillColor: '#6366f1', fillOpacity: 0.15, opacity: 0.9 }}
        />
      ) : (
        <Polyline
          positions={positions}
          pathOptions={{ color: '#6366f1', weight: 2.5, opacity: 0.9 }}
        />
      )}
      {points.map((p, i) => (
        <Marker
          key={`area-pt-${i}`}
          position={[p.lat, p.lng]}
          icon={dotIcon(i === 0 ? '#10b981' : '#6366f1')}
        />
      ))}
    </>
  );
}