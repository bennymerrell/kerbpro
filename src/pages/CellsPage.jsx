import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import usePullToRefresh from '../hooks/usePullToRefresh';
import { base44 } from '@/api/base44Client';
import { Search, MapPin, Eye, EyeOff, Trash2, ArrowLeft, SquareDashedBottom, Loader2, AlertCircle, Pencil } from 'lucide-react';

const WORK_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color: 'text-blue-600', bg: 'bg-blue-100', dot: 'bg-blue-500' },
  { value: 'in_progress', label: 'In Progress', color: 'text-orange-600', bg: 'bg-orange-100', dot: 'bg-orange-500' },
  { value: 'completed',   label: 'Completed',   color: 'text-green-600', bg: 'bg-green-100',  dot: 'bg-green-500' },
];

function WorkStatusBadge({ status }) {
  const opt = WORK_STATUS_OPTIONS.find(o => o.value === status) || WORK_STATUS_OPTIONS[0];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${opt.color} ${opt.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
      {opt.label}
    </span>
  );
}
import { cn } from '@/lib/utils';

function getExcluded(cell) {
  try { return JSON.parse(cell.excluded_road_types || '[]'); } catch { return []; }
}

function getBreakdown(cell) {
  try { return JSON.parse(cell.road_breakdown || '{}'); } catch { return {}; }
}

export default function CellsPage() {
  const navigate = useNavigate();
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [recalcTriggering, setRecalcTriggering] = useState({});
  // recalcTriggering kept for new-cell recalc (triggered from AreaResultsPanel flow)



  useEffect(() => { base44.auth.me().then(u => setCurrentUser(u)).catch(() => {}); }, []);
  useEffect(() => { base44.analytics.track({ eventName: 'page_view', properties: { page: 'cells' } }); }, []);

  const loadCells = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.Cell.list('-created_date', 200);
    setCells(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadCells(); }, [loadCells]);

  useEffect(() => {
    const unsub = base44.entities.Cell.subscribe((event) => {
      if (event.type === 'update') {
        setCells(prev => prev.map(c => c.id === event.id ? { ...c, ...event.data } : c));
      }
    });
    return unsub;
  }, []);

  const { refreshing } = usePullToRefresh(loadCells);

  const areas = [...new Set(cells.map(c => c.area).filter(Boolean))].sort();

  const filtered = cells.filter(c => {
    const matchesSearch = (c.name || 'Unnamed Cell').toLowerCase().includes(search.toLowerCase());
    const matchesArea = !areaFilter || c.area === areaFilter;
    return matchesSearch && matchesArea;
  });

  async function handleToggle(cell) {
    base44.analytics.track({ eventName: 'cell_visibility_toggled', properties: { visible: !cell.visible } });
    const newVisible = !cell.visible;
    // Optimistic update
    setCells(prev => prev.map(c => c.id === cell.id ? { ...c, visible: newVisible } : c));
    base44.entities.Cell.update(cell.id, { visible: newVisible }).catch(() => {
      // Revert on error
      setCells(prev => prev.map(c => c.id === cell.id ? { ...c, visible: cell.visible } : c));
    });
  }



  // Per-cell recalc is only used for brand-new cells (no mileage yet)
  async function handleRecalculate(cell) {
    base44.analytics.track({ eventName: 'cell_recalc_triggered' });
    setRecalcTriggering(prev => ({ ...prev, [cell.id]: true }));
    try {
      await base44.functions.invoke('triggerMileageRecalc', { cellId: cell.id });
      setCells(prev => prev.map(c => c.id === cell.id ? { ...c, recalc_status: 'pending' } : c));
    } finally {
      setRecalcTriggering(prev => ({ ...prev, [cell.id]: false }));
    }
  }



  async function handleWorkStatus(cell, newStatus) {
    const update = { work_status: newStatus };
    if (newStatus === 'completed') {
      update.completed_at = new Date().toISOString();
      update.completed_by = currentUser?.email || null;
    }
    setCells(prev => prev.map(c => c.id === cell.id ? { ...c, ...update } : c));
    base44.entities.Cell.update(cell.id, update).catch(() => {
      setCells(prev => prev.map(c => c.id === cell.id ? cell : c));
    });
  }

  async function handleDelete(cell) {
    base44.analytics.track({ eventName: 'cell_deleted' });
    // Optimistic update
    const prevCells = cells;
    setCells(prev => prev.filter(c => c.id !== cell.id));
    base44.entities.Cell.delete(cell.id).catch(() => setCells(prevCells));
  }

  function handleSelect(cell) {
    base44.analytics.track({ eventName: 'cell_selected', properties: { name: cell.name || 'Unnamed Cell' } });
    try {
      const points = JSON.parse(cell.points);
      const mileage = (cell.adopted_m != null && cell.unadopted_m != null)
        ? { adopted_m: cell.adopted_m, unadopted_m: cell.unadopted_m }
        : null;
      navigate('/', { state: { fitBounds: points.map(p => [p.lat, p.lng]), cellMileage: mileage, cellName: cell.name, selectedCell: cell } });
    } catch {
      navigate('/');
    }
  }

  async function handleToggleRoadType(cell, type, isExcluded) {
    const excluded = getExcluded(cell);
    const newExcluded = isExcluded ? excluded.filter(t => t !== type) : [...excluded, type];
    const newExcludedStr = JSON.stringify(newExcluded);
    await base44.entities.Cell.update(cell.id, { excluded_road_types: newExcludedStr });
    setCells(prev => prev.map(c => c.id === cell.id ? { ...c, excluded_road_types: newExcludedStr } : c));
  }

  function renderRoadTypes(cell) {
    const bd = getBreakdown(cell);
    const excluded = getExcluded(cell);
    const allTypes = new Set([...Object.keys(bd), ...excluded]);
    const entries = [...allTypes].map(t => [t, bd[t] || 0]).sort((a, b) => b[1] - a[1]);
    const includedTotal = entries.filter(([t]) => !excluded.includes(t)).reduce((s, [, m]) => s + m, 0);

    if (entries.length === 0) return (
      <div className="px-4 py-3 text-xs text-muted-foreground text-center">Run Recalc Miles to populate road types.</div>
    );

    return (
      <div className="px-4 py-3 bg-muted/20">
        <div className="flex justify-between items-center mb-2">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Road Type Breakdown</div>
          <div className="text-xs font-bold text-blue-600">{((includedTotal / 1609.34) * 2).toFixed(3)} mi spray</div>
        </div>
        <div className="space-y-1.5">
          {entries.map(([type, meters]) => {
            const isExcluded = excluded.includes(type);
            return (
              <div key={type} className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleRoadType(cell, type, isExcluded); }}
                  className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${isExcluded ? 'border-border bg-background' : 'border-blue-500 bg-blue-500'}`}
                >
                  {!isExcluded && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
                <span className="text-xs flex-1 capitalize text-muted-foreground">{type.replace(/_/g, ' ')}</span>
                <span className={`text-xs font-medium ${isExcluded ? 'text-muted-foreground/40' : 'text-foreground'}`}>
                  {meters > 0 ? (meters / 1609.34).toFixed(3) + ' mi' : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {refreshing && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-white rounded-full shadow-md px-4 py-1.5 text-xs text-gray-500 font-medium">
          Refreshing…
        </div>
      )}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
          <SquareDashedBottom className="h-4 w-4 text-indigo-600" />
        </div>
        <h1 className="font-semibold text-foreground flex-1">Cells</h1>
        <span className="text-xs text-muted-foreground">{cells.length} saved</span>
      </div>

      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search cells…"
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        {areas.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              onClick={() => setAreaFilter('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${!areaFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              All Areas
            </button>
            {areas.map(area => (
              <button
                key={area}
                onClick={() => setAreaFilter(areaFilter === area ? '' : area)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${areaFilter === area ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                {area}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 px-4 py-3 space-y-2 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Loading…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <SquareDashedBottom className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">{search ? 'No cells match your search' : 'No cells saved yet'}</p>
          </div>
        )}
        {filtered.map(cell => (
          <div key={cell.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <button
              onClick={() => handleSelect(cell)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
            >
              <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
              <div className={cn("font-medium text-sm text-foreground truncate", !cell.visible && "line-through text-muted-foreground")}>
                {cell.name || 'Unnamed Cell'}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center flex-wrap gap-2">
                {cell.area && <span>{cell.area}</span>}
                {(() => { try { return JSON.parse(cell.points).length + ' pts'; } catch { return ''; } })()}
                {cell.adopted_m != null && (
                  <span className="text-blue-600 font-medium">{((cell.adopted_m / 1609.34) * 2).toFixed(2)} mi</span>
                )}
                {currentUser?.role === 'admin' && <WorkStatusBadge status={cell.work_status} />}
              </div>
              </div>
              <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180 flex-shrink-0" />
            </button>

            {currentUser?.role === 'admin' && renderRoadTypes(cell)}

            {/* Work status row - admin only */}
            {currentUser?.role === 'admin' && <div className="flex border-t border-border">
              {WORK_STATUS_OPTIONS.map((opt, idx) => (
                <button
                  key={opt.value}
                  onClick={() => handleWorkStatus(cell, opt.value)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors
                    ${cell.work_status === opt.value
                      ? `${opt.color} ${opt.bg}`
                      : 'text-muted-foreground hover:bg-muted/40'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                  {opt.label}
                </button>
              ))}
            </div>}

            <div className="flex border-t border-border">
              <button
                onClick={() => handleToggle(cell)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
              >
                {cell.visible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {cell.visible !== false ? 'Visible' : 'Hidden'}
              </button>
              {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && <>
                <div className="w-px bg-border" />
                <button
                  onClick={() => navigate('/', { state: { editCell: cell } })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-amber-50 hover:text-amber-600 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Shape
                </button>
                {/* Only show manual recalc for cells with no mileage data yet */}
                {cell.adopted_m == null && <>
                  <div className="w-px bg-border" />
                  <button
                    onClick={() => handleRecalculate(cell)}
                    disabled={recalcTriggering[cell.id] || cell.recalc_status === 'pending' || cell.recalc_status === 'processing'}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-50"
                  >
                    {(cell.recalc_status === 'pending' || cell.recalc_status === 'processing') ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" />{cell.recalc_status === 'pending' ? 'Queued…' : 'Calculating…'}</>
                    ) : recalcTriggering[cell.id] ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" />Queuing…</>
                    ) : (
                      <>Calc Miles</>
                    )}
                  </button>
                </>}
                <div className="w-px bg-border" />
                <button
                  onClick={() => handleDelete(cell)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </>}
            </div>



            {cell.adopted_m == null && cell.recalc_status === 'error' && cell.recalc_error && (
              <div className="w-full px-3 py-1.5 text-[10px] text-red-600 bg-red-50 text-center flex items-center justify-center gap-1">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />{cell.recalc_error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}