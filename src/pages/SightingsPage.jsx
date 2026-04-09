import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import usePullToRefresh from '../hooks/usePullToRefresh';
import { ArrowLeft, Search, ArrowUpDown, Leaf, Image, Eye, Map } from 'lucide-react';
import SightingDetailModal from '../components/SightingDetailModal';
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
                className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all flex flex-col"
              >
                {s.photo_url ? (
                  <img src={s.photo_url} alt={s.species} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-muted flex items-center justify-center">
                    <Image className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
                <div className="p-3 space-y-1.5 flex-1">
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
        <SightingDetailModal sighting={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}