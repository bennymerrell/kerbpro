import { useState, useRef } from 'react';
import { Marker, Polygon } from 'react-leaflet';
import L from 'leaflet';

function makePointIcon(index, total) {
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

export default function CellEditLayer({ points, onChange }) {
  const positions = points.map(p => [p.lat, p.lng]);

  function handleDragEnd(index, e) {
    const { lat, lng } = e.target.getLatLng();
    const updated = points.map((p, i) => i === index ? { lat, lng } : p);
    onChange(updated);
  }

  return (
    <>
      <Polygon
        positions={positions}
        pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.15, weight: 2, dashArray: '6 4' }}
      />
      {points.map((p, i) => (
        <Marker
          key={i}
          position={[p.lat, p.lng]}
          icon={makePointIcon(i, points.length)}
          draggable
          eventHandlers={{ dragend: (e) => handleDragEnd(i, e) }}
        />
      ))}
    </>
  );
}