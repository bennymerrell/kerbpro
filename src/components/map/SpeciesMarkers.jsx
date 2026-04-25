import { useRef } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { base44 } from '@/api/base44Client';

const CATEGORY_SVGS = {
  'Species': `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M5 9c0-4 3-7 7-7s7 3 7 7c0 5-7 11-7 11S5 14 5 9z"/></svg>`,
  'Free Parking': `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>`,
  'Hydrant': `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6"/><path d="M10 4V2"/><path d="M14 4V2"/><rect x="7" y="4" width="10" height="5" rx="1"/><rect x="9" y="9" width="6" height="8" rx="1"/><path d="M9 13H7"/><path d="M15 13h2"/><path d="M10 17v3"/><path d="M14 17v3"/></svg>`,
  'Hydrant_not_working': `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6"/><path d="M10 4V2"/><path d="M14 4V2"/><rect x="7" y="4" width="10" height="5" rx="1"/><rect x="9" y="9" width="6" height="8" rx="1"/><path d="M9 13H7"/><path d="M15 13h2"/><path d="M10 17v3"/><path d="M14 17v3"/><line x1="4" y1="4" x2="20" y2="20"/></svg>`,
  'Incident': `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  'Public Toilet': `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11V6a2 2 0 0 0-4 0v5"/><path d="M5 11h4"/><path d="M7 11v7"/><path d="M15 7v11"/><path d="M13 7h4a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-4"/><circle cx="7" cy="3" r="1"/><circle cx="15" cy="3" r="1"/></svg>`,
  'Cafe / Van': `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>`,
};

const CATEGORY_COLORS = {
  'Species':       '#16a34a',
  'Free Parking':  '#2563eb',
  'Hydrant':             '#f59e0b',
  'Hydrant_not_working': '#9ca3af',
  'Incident':      '#7c3aed',
  'Public Toilet': '#d97706',
  'Cafe / Van':    '#ea580c',
};

function createSightingIcon(sighting) {
  const category = sighting.species?.match(/^\[(.+?)\]/)?.[1] || 'Species';
  const isNotWorking = category === 'Hydrant' && sighting.status_details === 'not_working';
  const key = isNotWorking ? 'Hydrant_not_working' : category;
  const color = CATEGORY_COLORS[key] || '#2563eb';

  let innerHtml;
  if (category === 'Hydrant') {
    const textColor = isNotWorking ? '#ffffff' : '#000000';
    innerHtml = `<span style="font-size:18px;font-weight:900;color:${textColor};font-family:Arial,sans-serif;line-height:1;">H</span>`;
  } else {
    const svg = CATEGORY_SVGS[key] || CATEGORY_SVGS['Species'];
    innerHtml = svg;
  }

  const badge = category === 'Hydrant' && sighting.status_details
    ? `<div style="position:absolute;bottom:-4px;right:-4px;width:14px;height:14px;border-radius:50%;background:${isNotWorking ? '#ef4444' : '#22c55e'};border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:8px;color:white;font-weight:bold;">${isNotWorking ? '\u2715' : '\u2713'}</div>`
    : '';

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="position:relative;width:34px;height:34px;"><div style="
      width: 34px; height: 34px; border-radius: 4px;
      background: ${color};
      border: 3px solid ${isNotWorking ? '#6b7280' : '#000'};
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    ">${innerHtml}</div>${badge}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function DraggableSightingMarker({ sighting, onViewDetails, onMoved }) {
  const markerRef = useRef(null);

  return (
    <Marker
      ref={markerRef}
      position={[sighting.lat, sighting.lng]}
      icon={createSightingIcon(sighting)}
      draggable
      eventHandlers={{
        click: () => onViewDetails && onViewDetails(sighting),
        dragend: async () => {
          const latlng = markerRef.current?.getLatLng();
          if (!latlng || !sighting.id) return;
          await base44.entities.Sighting.update(sighting.id, { lat: latlng.lat, lng: latlng.lng });
          onMoved?.(sighting.id, latlng.lat, latlng.lng);
        },
      }}
    />
  );
}

export default function SpeciesMarkers({ sightings, onRemove, onViewDetails, onSightingMoved }) {
  return sightings.map((s, i) => (
    <DraggableSightingMarker
      key={`sighting-${s.id || i}-${s.lat}-${s.lng}`}
      sighting={s}
      onViewDetails={onViewDetails}
      onMoved={onSightingMoved}
    />
  ));
}