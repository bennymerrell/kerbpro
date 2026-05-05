import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import usePullToRefresh from '../hooks/usePullToRefresh';
import { ArrowLeft, Search, ArrowUpDown, Leaf, Eye, Map, Check, EyeOff } from 'lucide-react';
import SightingDetailModal from '../components/SightingDetailModal';
import { format } from 'date-fns';

const CATEGORIES = ['Species', 'Free Parking', 'Hydrant', 'WO Point', 'Public Toilet', 'Cafe / Van'];

const CATEGORY_SVGS = {
  'Species': `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M5 9c0-4 3-7 7-7s7 3 7 7c0 5-7 11-7 11S5 14 5 9z"/></svg>`,
  'Free Parking': `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>`,
  'WO Point': `<span style="font-size:10px;font-weight:900;color:#60b8e0;font-family:Arial,sans-serif;line-height:1;">WO</span>`,
  'Public Toilet': `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11V6a2 2 0 0 0-4 0v5"/><path d="M5 11h4"/><path d="M7 11v7"/><path d="M15 7v11"/><path d="M13 7h4a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-4"/><circle cx="7" cy="3" r="1"/><circle cx="15" cy="3" r="1"/></svg>`,
  'Cafe / Van': `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>`,
};

const CATEGORY_BG = {
  'Species':      '#16a34a',
  'Free Parking': '#2563eb',
  'Hydrant':      '#f59e0b',
  'WO Point':     '#ffffff',
  'Public Toilet':'#d97706',
  'Cafe / Van':   '#ea580c',
};

function CategoryMapIcon({ category, statusDetails }) {
  const isHydrant = category === 'Hydrant';
  const isWOPoint = category === 'WO Point';
  const isNotWorking = (isHydrant || isWOPoint) && statusDetails === 'not_working';
  const bg = isNotWorking ? '#9ca3af' : (CATEGORY_BG[category] || '#2563eb');
  const border = isNotWorking ? '#6b7280' : (isWOPoint ? '#60b8e0' : '#000');

  const inner = isHydrant
    ? `<span style="font-size:13px;font-weight:900;color:${isNotWorking ? '#fff' : '#000'};font-family:Arial,sans-serif;line-height:1;">H</span>`
    : isWOPoint
      ? `<span style="font-size:10px;font-weight:900;color:${isNotWorking ? '#fff' : '#60b8e0'};font-family:Arial,sans-serif;line-height:1;">WO</span>`
      : (CATEGORY_SVGS[category] || CATEGORY_SVGS['Species']);

  return (
    <div
      style={{
        width: 26, height: 26, borderRadius: 4,
        background: bg,
        border: `2px solid ${border}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}

const SORT_OPTIONS = [
  { value: '-created_date', label: 'Newest first' },
  { value: 'created_date', label: 'Oldest first' },
  { value: 'species', label: 'Species A–Z' },
  { value: '-species', label: 'Species Z–A' },
];

export default function SightingsPage() {
  const navigate = useNavigate();
  useEffect(() => { base44.analytics.track({ eventName: 'page_view', properties: { page: 'sightings' } }); }, []);
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('-created_date');
  const [activeCategories, setActiveCategories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showSortPicker, setShowSortPicker] = useState(false);

  const loadSightings = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.Sighting.list(sort, 200);
    setSightings(data);
    setLoading(false);
  }, [sort]);

  useEffect(() => { loadSightings(); }, [loadSightings]);

  const { refreshing } = usePullToRefresh(loadSightings);

  const filtered = sightings.filter(s => {
    const cat = s.species?.match(/^\[(.+?)\]/)?.[1] || 'Species';
    const matchesSearch = s.species?.toLowerCase().includes(search.toLowerCase()) || s.notes?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategories.length === 0 || activeCategories.length === CATEGORIES.length || activeCategories.includes(cat);
    return matchesSearch && matchesCategory;
  });

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
      <div className="px-4 py-3 flex flex-col gap-2 border-b border-border bg-card/50">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sighting or notes..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowSortPicker(true)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground hover:bg-muted/60 transition-colors select-none"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground hidden sm:inline">{SORT_OPTIONS.find(o => o.value === sort)?.label}</span>
          </button>
        </div>

        {/* Sort picker — iOS bottom sheet */}
        {showSortPicker && (
          <div className="fixed inset-0 z-[4000] flex items-end" onClick={() => setShowSortPicker(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div
              className="relative w-full bg-card rounded-t-2xl shadow-2xl border-t border-border"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="px-4 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Sort By</div>
              {SORT_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { setSort(o.value); setShowSortPicker(false); }}
                  className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-foreground hover:bg-muted/60 active:bg-muted transition-colors select-none"
                >
                  <span>{o.label}</span>
                  {sort === o.value && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Category filter chips */}
        <div>
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Category</div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategories([])}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${activeCategories.length === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              All
            </button>
            {CATEGORIES.map(cat => {
              const on = activeCategories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategories(on ? activeCategories.filter(c => c !== cat) : [...activeCategories, cat])}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bulk show/hide bar — mirrors CellsPage */}
      {!loading && filtered.length > 0 && (
        <div className="px-4 py-2 border-b border-border flex items-center justify-between gap-2 bg-muted/30">
          <span className="text-xs text-muted-foreground">{filtered.length} sighting{filtered.length !== 1 ? 's' : ''} shown</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCategories([])}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-card border border-border hover:bg-muted transition-colors text-foreground"
            >
              <Eye className="h-3 w-3" /> Show All
            </button>
            <button
              onClick={() => setActiveCategories([...CATEGORIES])}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-card border border-border hover:bg-muted transition-colors text-foreground"
            >
              <EyeOff className="h-3 w-3" /> Hide All
            </button>
          </div>
        </div>
      )}

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
                {s.photo_url && (
                  <img src={s.photo_url} alt={s.species} className="w-full h-40 object-cover" />
                )}
                <div className="p-3 space-y-1.5 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {(() => {
                        const cat = s.species?.match(/^\[(.+?)\]/)?.[1] || 'Species';
                        const label = s.species?.replace(/^\[.+?\]\s*/, '').trim() || cat;
                        return (
                          <>
                            <CategoryMapIcon category={cat} statusDetails={s.status_details} />
                            <h3 className="font-semibold text-sm text-foreground leading-tight truncate min-w-0">{label}</h3>
                          </>
                        );
                      })()}
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded whitespace-nowrap">
                      {s.created_date ? format(new Date(s.created_date), 'dd MMM yyyy') : '—'}
                    </span>
                  </div>
                  {s.status_details && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      s.status_details === 'working' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {s.status_details === 'working' ? '✅ Working' : '❌ Not Working'}
                    </span>
                  )}
                  {s.notes && <p className="text-xs text-muted-foreground line-clamp-2">{s.notes}</p>}
                </div>
                <div className="flex gap-2 px-3 pb-3">
                  <button
                    onClick={() => {
                      const cat = s.species?.match(/^\[(.+?)\]/)?.[1] || 'Species';
                      base44.analytics.track({ eventName: 'sightings_view_on_map_clicked', properties: { category: cat } });
                      navigate('/', { state: { flyTo: [s.lat, s.lng], activateCategory: cat } });
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Map className="h-3.5 w-3.5" />
                    View on Map
                  </button>
                  <button
                    onClick={() => { base44.analytics.track({ eventName: 'sightings_view_details_clicked' }); setSelected(s); }}
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