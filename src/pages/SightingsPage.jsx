import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import usePullToRefresh from '../hooks/usePullToRefresh';
import { ArrowLeft, Search, ArrowUpDown, MapPin, Calendar, Leaf, Image, Eye, Map, X, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';

const SORT_OPTIONS = [
  { value: '-created_date', label: 'Newest first' },
  { value: 'created_date', label: 'Oldest first' },
  { value: 'species', label: 'Species A–Z' },
  { value: '-species', label: 'Species Z–A' },
];

export default function SightingsPage() {
  const navigate = useNavigate();
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('-created_date');
  const [selected, setSelected] = useState(null);

  const loadSightings = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.Sighting.list(sort, 200);
    setSightings(data);
    setLoading(false);
  }, [sort]);

  useEffect(() => { loadSightings(); }, [loadSightings]);

  const { refreshing } = usePullToRefresh(loadSightings);

  const filtered = sightings.filter(s =>
    s.species?.toLowerCase().includes(search.toLowerCase()) ||
    s.notes?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {refreshing && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-white rounded-full shadow-md px-4 py-1.5 text-xs text-gray-500 font-medium">
          Refreshing…
        </div>
      )}
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <Leaf className="h-5 w-5 text-emerald-600" />
          <h1 className="font-semibold text-foreground text-base">Sightings</h1>
          {!loading && (
            <span className="ml-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {filtered.length}
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 flex flex-col sm:flex-row gap-2 border-b border-border bg-card/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search species or notes..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        </div>
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="h-9 pl-9 pr-8 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-border border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Leaf className="h-10 w-10 opacity-30" />
            <p className="text-sm">{search ? 'No results match your search.' : 'No sightings recorded yet.'}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(s => (
              <div
                key={s.id}
                className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all"
              >
                {s.photo_url ? (
                  <img src={s.photo_url} alt={s.species} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-muted flex items-center justify-center">
                    <Image className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
                <div className="p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-foreground leading-tight">{s.species}</h3>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded whitespace-nowrap">
                      {s.created_date ? format(new Date(s.created_date), 'dd MMM yyyy') : '—'}
                    </span>
                  </div>
                  {s.notes && <p className="text-xs text-muted-foreground line-clamp-2">{s.notes}</p>}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span>{s.lat?.toFixed(4)}, {s.lng?.toFixed(4)}</span>
                  </div>
                </div>
                <div className="flex gap-2 px-3 pb-3">
                  <button
                    onClick={() => {
                      const cat = s.species?.match(/^\[(.+?)\]/)?.[1] || 'Species';
                      navigate('/', { state: { flyTo: [s.lat, s.lng], activateCategory: cat } });
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Map className="h-3.5 w-3.5" />
                    View on Map
                  </button>
                  <button
                    onClick={() => setSelected(s)}
                    className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <SightingDetailModal sighting={selected} onClose={() => setSelected(null)} navigate={navigate} />
      )}
    </div>
  );
}

function SightingDetailModal({ sighting, onClose, navigate }) {
  const [fullscreen, setFullscreen] = useState(false);

  if (fullscreen && sighting.photo_url) {
    return (
      <div className="fixed inset-0 z-[3000] bg-black flex items-center justify-center" onClick={() => setFullscreen(false)}>
        <button className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}>
          <X className="h-5 w-5" />
        </button>
        <img src={sighting.photo_url} alt={sighting.species} className="max-w-full max-h-full object-contain" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {sighting.photo_url ? (
          <div className="relative">
            <img src={sighting.photo_url} alt={sighting.species} className="w-full h-52 object-cover" />
            <button
              onClick={() => setFullscreen(true)}
              className="absolute bottom-2 right-2 w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="w-full h-32 bg-muted flex items-center justify-center">
            <Image className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="p-5 space-y-3">
          <h2 className="font-bold text-foreground text-lg">{sighting.species}</h2>
          {sighting.notes && <p className="text-sm text-muted-foreground">{sighting.notes}</p>}
          {sighting.reported_by && (
            <p className="text-xs text-muted-foreground">Reported by: {sighting.reported_by}</p>
          )}
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              <span>{sighting.lat?.toFixed(6)}, {sighting.lng?.toFixed(6)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>{sighting.created_date ? format(new Date(sighting.created_date), 'dd MMMM yyyy, HH:mm') : '—'}</span>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                const cat = sighting.species?.match(/^\[(.+?)\]/)?.[1] || 'Species';
                onClose();
                navigate('/', { state: { flyTo: [sighting.lat, sighting.lng], activateCategory: cat } });
              }}
              className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Map className="h-3.5 w-3.5" />
              View on Map
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-9 rounded-lg bg-muted hover:bg-muted/70 text-sm font-medium text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}