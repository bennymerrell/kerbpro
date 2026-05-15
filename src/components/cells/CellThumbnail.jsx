import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [map, points]);
  return null;
}

const STATUS_COLORS = {
  completed:   { stroke: '#16a34a', fill: '#16a34a' },
  in_progress: { stroke: '#f97316', fill: '#f97316' },
  not_started: { stroke: '#3b82f6', fill: '#3b82f6' },
};

export default function CellThumbnail({ cell, className = '' }) {
  const colors = STATUS_COLORS[cell.work_status] || STATUS_COLORS.not_started;
  const points = useMemo(() => {
    try {
      const parsed = JSON.parse(cell.points);
      return parsed.map(p => [p.lat, p.lng]);
    } catch {
      return null;
    }
  }, [cell.points]);

  const center = useMemo(() => {
    if (!points || points.length === 0) return null;
    const lat = points.reduce((s, p) => s + p[0], 0) / points.length;
    const lng = points.reduce((s, p) => s + p[1], 0) / points.length;
    return [lat, lng];
  }, [points]);

  if (!points || !center) return null;

  return (
    <div className={`rounded-t-lg overflow-hidden border-x border-t border-border ${className}`} style={{ pointerEvents: 'none', zIndex: 0, position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={14}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Polygon
          positions={points}
          pathOptions={{ color: colors.stroke, fillColor: colors.fill, fillOpacity: 0.25, weight: 2 }}
        />
        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
}