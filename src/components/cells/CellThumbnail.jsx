import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [10, 10] });
    }
  }, [map, points]);
  return null;
}

export default function CellThumbnail({ cell, className = '' }) {
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
    <div className={`rounded-lg overflow-hidden border border-border ${className}`} style={{ pointerEvents: 'none' }}>
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
          pathOptions={{ color: '#059669', fillColor: '#059669', fillOpacity: 0.25, weight: 2 }}
        />
        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
}