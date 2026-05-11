import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import usePullToRefresh from '../hooks/usePullToRefresh';
import { Search, Leaf, Eye, Map, EyeOff } from 'lucide-react';
import SightingDetailModal from '../components/SightingDetailModal';
import { format, startOfWeek } from 'date-fns';
import { pointInPolygon } from '@/lib/mapUtils';

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
      style={{ width: 26, height: 26, borderRadius: 4, background: bg, border: `2px solid ${border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}

export default function SightingsPage() {
  const navigate = useNavigate();
  useEffect(() => { base44.analytics.track({ eventName: 'page_view', properties: { page: 'sightings' } }); }, []);

  const [sightings, setSightings] = useState([]);
  const [cells, setCells] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategories, setActiveCategories] = useState([]);
  const [officeFilter, setOfficeFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [cellFilter, setCellFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { base44.auth.me().then(u => setCurrentUser(u)).catch(() => {}); }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [sightingData, cellData, officeData] = await Promise.all([
      base44.entities.Sighting.list('-created_date', 500),
      base44.entities.Cell.list('-created_date', 200),
      base44.entities.Office.list(),
    ]);
    setSightings(sightingData);
    setCells(cellData);
    setOffices(officeData);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const { refreshing } = usePullToRefresh(loadData);

  const officeMap = Object.fromEntries(offices.map(o => [o.id, o.name]));

  // Areas filtered by selected office
  const areas = [...new Set(
    cells.filter(c => !officeFilter || c.office_id === officeFilter).map(c => c.area).filter(Boolean)
  )].sort();

  // Cells filtered by selected office + area
  const filteredCellOptions = cells.filter(c =>
    (!officeFilter || c.office_id === officeFilter) &&
    (!areaFilter || c.area === areaFilter)
  );

  // Build polygon lookup for selected cell (or all matching cells)
  const polygonsForFilter = cellFilter
    ? cells.filter(c => c.id === cellFilter).map(c => { try { return JSON.parse(c.points || '[]'); } catch { return []; } }).filter(pts => pts.length >= 3)
    : areaFilter
      ? cells.filter(c => c.area === areaFilter && (!officeFilter || c.office_id === officeFilter)).map(c => { try { return JSON.parse(c.points || '[]'); } catch { return []; } }).filter(pts => pts.length >= 3)
      : officeFilter
        ? cells.filter(c => c.office_id === officeFilter).map(c => { try { return JSON.parse(c.points || '[]'); } catch { return []; } }).filter(pts => pts.length >= 3)
        : null; // null = no geo filter

  const filtered = sightings.filter(s => {
    const cat = s.species?.match(/^\[(.+?)\]/)?.[1] || 'Species';
    const matchesSearch = s.species?.toLowerCase().includes(search.toLowerCase()) || s.notes?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategories.length === 0 || activeCategories.includes(cat);
    const matchesGeo = !polygonsForFilter || (s.lat && s.lng && polygonsForFilter.some(poly => pointInPolygon(s.lat, s.lng, poly)));
    return matchesSearch && matchesCategory && matchesGeo;
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
        <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">
          <Map className="h-5 w-5" />
        </button>
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
      <div className="px-4 py-3 flex flex-col gap-3 border-b border-border bg-card/50">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sighting or notes..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        </div>

        {/* Office filter */}
        {offices.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Office</div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => { setOfficeFilter(''); setAreaFilter(''); setCellFilter(''); }} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${!officeFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>All</button>
              {offices.map(o => (
                <button key={o.id} onClick={() => { setOfficeFilter(officeFilter === o.id ? '' : o.id); setAreaFilter(''); setCellFilter(''); }} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${officeFilter === o.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{o.name}</button>
              ))}
            </div>
          </div>
        )}

        {/* Contract filter */}
        {areas.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Contract</div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => { setAreaFilter(''); setCellFilter(''); }} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${!areaFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>All</button>
              {areas.map(a => (
                <button key={a} onClick={() => { setAreaFilter(areaFilter === a ? '' : a); setCellFilter(''); }} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${areaFilter === a ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{a}</button>
              ))}
            </div>
          </div>
        )}

        {/* Cell filter */}
        {filteredCellOptions.length > 0 && (areaFilter || officeFilter) && (
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Cell</div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setCellFilter('')} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${!cellFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>All</button>
              {filteredCellOptions.map(c => (
                <button key={c.id} onClick={() => setCellFilter(cellFilter === c.id ? '' : c.id)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${cellFilter === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{c.name || 'Unnamed'}</button>
              ))}
            </div>
          </div>
        )}

        {/* Category filter */}
        <div>
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Category</div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setActiveCategories([])} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${activeCategories.length === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>All</button>
            {CATEGORIES.map(cat => {
              const on = activeCategories.includes(cat);
              return (
                <button key={cat} onClick={() => setActiveCategories(on ? activeCategories.filter(c => c !== cat) : [...activeCategories, cat])} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{cat}</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Count bar */}
      {!loading && sightings.length > 0 && (
        <div className="px-4 py-2 border-b border-border flex items-center justify-between gap-2 bg-muted/30">
          <span className="text-xs text-muted-foreground">{filtered.length} of {sightings.length} sighting{sightings.length !== 1 ? 's' : ''} shown</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveCategories([])} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-card border border-border hover:bg-muted transition-colors text-foreground">
              <Eye className="h-3 w-3" /> Show All
            </button>
            <button onClick={() => setActiveCategories(['__none__'])} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-card border border-border hover:bg-muted transition-colors text-foreground">
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
              <div key={s.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all flex flex-col">
                {s.photo_url ? (
                  <img src={s.photo_url} alt={s.species} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-card flex items-center justify-center">
                    <Leaf className="h-12 w-12 text-emerald-600" />
                  </div>
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
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.status_details === 'working' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
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

      {selected && (
        <SightingDetailModal sighting={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}