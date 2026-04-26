import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Leaf, Loader2 } from 'lucide-react';

/* Point-in-polygon (ray casting) */
function pointInPolygon(lat, lng, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

const CATEGORY_COLORS = {
  'Species':       'bg-green-100 text-green-700',
  'Free Parking':  'bg-blue-100 text-blue-700',
  'Hydrant':       'bg-amber-100 text-amber-700',
  'Incident':      'bg-purple-100 text-purple-700',
  'Public Toilet': 'bg-orange-100 text-orange-700',
  'Cafe / Van':    'bg-red-100 text-red-700',
};

export default function CellSightingsPanel({ cell, onClose }) {
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cell) return;
    setLoading(true);
    base44.entities.Sighting.list('-created_date', 500).then(all => {
      let polygon = [];
      try { polygon = JSON.parse(cell.points); } catch {}
      const inside = polygon.length > 0
        ? all.filter(s => s.lat != null && s.lng != null && pointInPolygon(s.lat, s.lng, polygon))
        : [];
      setSightings(inside);
      setLoading(false);
    });
  }, [cell?.id]);

  if (!cell) return null;

  return (
    <div
      className="fixed right-0 top-0 h-full z-[1500] flex items-center"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="relative bg-white/95 backdrop-blur-xl shadow-2xl border-l border-border flex flex-col"
        style={{
          width: 260,
          maxHeight: '80vh',
          marginTop: 'env(safe-area-inset-top, 0px)',
          borderRadius: '12px 0 0 12px',
          pointerEvents: 'all',
          animation: 'slideInRight 0.25s ease-out',
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-3 border-b border-border flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Leaf className="h-3.5 w-3.5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-foreground truncate">{cell.name || 'Cell'}</div>
            <div className="text-[10px] text-muted-foreground">Sightings in this cell</div>
          </div>
          <button onClick={onClose} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-3 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : sightings.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No sightings recorded<br />in this cell yet
            </div>
          ) : (
            <ul className="space-y-1.5">
              {sightings.map(s => {
                const cat = s.species?.match(/^\[(.+?)\]/)?.[1] || 'Species';
                const name = s.species?.replace(/^\[.+?\]\s*/, '') || '—';
                const colorClass = CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-700';
                return (
                  <li key={s.id} className="flex items-start gap-2">
                    <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold flex-shrink-0 ${colorClass}`}>
                      {cat}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-foreground font-medium truncate">{name}</div>
                      {s.notes && <div className="text-[10px] text-muted-foreground truncate">{s.notes}</div>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer count */}
        {!loading && sightings.length > 0 && (
          <div className="border-t border-border px-3 py-2 flex-shrink-0">
            <div className="text-[10px] text-muted-foreground text-center">
              {sightings.length} sighting{sightings.length !== 1 ? 's' : ''} found
            </div>
          </div>
        )}
      </div>
    </div>
  );
}