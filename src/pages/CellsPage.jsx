import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import usePullToRefresh from '../hooks/usePullToRefresh';
import { base44 } from '@/api/base44Client';
import { Search, MapPin, Eye, EyeOff, Map, SquareDashedBottom, Loader2 } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';

import { cn } from '@/lib/utils';

export default function CellsPage() {
  const navigate = useNavigate();
  const [cells, setCells] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [officeFilter, setOfficeFilter] = useState('');

  const [showAllCells, setShowAllCells] = useState(() => localStorage.getItem('cells_show_all') === '1');
  const [userCellIds, setUserCellIds] = useState(null); // null = not loaded yet

  useEffect(() => { base44.auth.me().then(u => setCurrentUser(u)).catch(() => {}); }, []);
  useEffect(() => { base44.analytics.track({ eventName: 'page_view', properties: { page: 'cells' } }); }, []);

  const loadCells = useCallback(async () => {
    setLoading(true);
    const [data, officeData] = await Promise.all([
      base44.entities.Cell.list('-created_date', 200),
      base44.entities.Office.list(),
    ]);
    setCells(data);
    setOffices(officeData);
    setLoading(false);
  }, []);

  useEffect(() => { loadCells(); }, [loadCells]);

  // For regular users, build the set of their assigned/planned cell IDs
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'admin' || currentUser.role === 'manager') {
      setUserCellIds(null); // no filtering for admins/managers
      return;
    }
    const userId = currentUser.id;
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekKey = format(monday, 'yyyy-MM-dd');

    Promise.all([
      base44.entities.Cell.list('-created_date', 200),
      base44.entities.WeeklyPlan.filter({ week_start: weekKey }),
    ]).then(([allCells, plans]) => {
      const ids = new Set();
      for (const cell of allCells) {
        try {
          const assigned = JSON.parse(cell.assigned_user_ids || '[]');
          if (assigned.includes(userId)) ids.add(cell.id);
        } catch {}
      }
      if (plans[0]) {
        try {
          const assignments = JSON.parse(plans[0].assignments || '[]');
          for (const a of assignments) {
            if (a.user_id === userId) ids.add(a.cell_id);
          }
        } catch {}
      }
      if (currentUser.active_cell_id) ids.add(currentUser.active_cell_id);
      setUserCellIds(ids);
    }).catch(() => setUserCellIds(new Set()));
  }, [currentUser]);

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
  const officeMap = Object.fromEntries(offices.map(o => [o.id, o.name]));

  const isRegularUser = currentUser && currentUser.role !== 'admin' && currentUser.role !== 'manager';
  const baseCells = (isRegularUser && !showAllCells && userCellIds !== null)
    ? cells.filter(c => userCellIds.has(c.id))
    : cells;

  const filtered = baseCells.filter(c => {
    const matchesSearch = (c.name || 'Unnamed Cell').toLowerCase().includes(search.toLowerCase());
    const matchesArea = !areaFilter || c.area === areaFilter;
    const matchesOffice = !officeFilter || c.office_id === officeFilter;
    return matchesSearch && matchesArea && matchesOffice;
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
          <Map className="h-4 w-4 text-foreground" />
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
        {offices.length > 0 && (
          <div className="pt-2">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Office</div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setOfficeFilter('')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${!officeFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                All
              </button>
              {offices.map(office => (
                <button
                  key={office.id}
                  onClick={() => setOfficeFilter(officeFilter === office.id ? '' : office.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${officeFilter === office.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  {office.name}
                </button>
              ))}
            </div>
          </div>
        )}
        {areas.length > 0 && (
          <>
            {offices.length > 0 && <div className="border-t border-border mt-3" />}
            <div className={offices.length > 0 ? 'pt-3' : 'pt-2'}>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Contract</div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setAreaFilter('')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${!areaFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  All
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
            </div>
          </>
        )}
      </div>

      {/* My Cells / All toggle for regular users */}
      {isRegularUser && userCellIds !== null && (
        <div className="px-4 py-3 border-b border-border">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">View</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowAllCells(false); localStorage.setItem('cells_show_all', '0'); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${!showAllCells ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              My Cells
            </button>
            <button
              onClick={() => { setShowAllCells(true); localStorage.setItem('cells_show_all', '1'); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${showAllCells ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              All Cells
            </button>
          </div>
        </div>
      )}

      {/* Bulk visibility controls for filtered selection */}
      {filtered.length > 0 && (
        <div className="px-4 py-2 border-b border-border flex items-center justify-between gap-2 bg-muted/30">
          <span className="text-xs text-muted-foreground">{filtered.length} cell{filtered.length !== 1 ? 's' : ''} shown</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                filtered.forEach(cell => {
                  if (cell.visible === false) {
                    setCells(prev => prev.map(c => c.id === cell.id ? { ...c, visible: true } : c));
                    base44.entities.Cell.update(cell.id, { visible: true });
                  }
                });
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-card border border-border hover:bg-muted transition-colors text-foreground"
            >
              <Eye className="h-3 w-3" /> Show All
            </button>
            <button
              onClick={() => {
                filtered.forEach(cell => {
                  if (cell.visible !== false) {
                    setCells(prev => prev.map(c => c.id === cell.id ? { ...c, visible: false } : c));
                    base44.entities.Cell.update(cell.id, { visible: false });
                  }
                });
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-card border border-border hover:bg-muted transition-colors text-foreground"
            >
              <EyeOff className="h-3 w-3" /> Hide All
            </button>
          </div>
        </div>
      )}

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
                {cell.office_id && officeMap[cell.office_id] && <span className="text-indigo-500 font-medium">{officeMap[cell.office_id]}</span>}
                {cell.area && <span>{cell.area}</span>}
                {(() => { try { return JSON.parse(cell.points).length + ' pts'; } catch { return ''; } })()}
                {cell.adopted_m != null && (
                  <span className="text-blue-600 font-medium">{Math.round((cell.adopted_m / 1609.34) * 2)} mi</span>
                )}

              </div>
              </div>
              <Map className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>

            <div className="flex border-t border-border">
              <button
                onClick={() => handleToggle(cell)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
              >
                {cell.visible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {cell.visible !== false ? 'Visible' : 'Hidden'}
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}