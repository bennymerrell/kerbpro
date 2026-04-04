import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import usePullToRefresh from '../hooks/usePullToRefresh';
import { base44 } from '@/api/base44Client';
import { Search, MapPin, Eye, EyeOff, Trash2, ArrowLeft, SquareDashedBottom, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

async function queryMileage(points) {
  const res = await base44.functions.invoke('queryMileage', { points });
  if (res.data?.error) throw new Error(res.data.error);
  return { adoptedM: res.data.adoptedM, unadoptedM: res.data.unadoptedM };
}

function getCellCenter(cell) {
  try {
    const points = JSON.parse(cell.points);
    if (!points.length) return null;
    const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
    const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
    return [lat, lng];
  } catch { return null; }
}

export default function CellsPage() {
  const navigate = useNavigate();
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [recalculating, setRecalculating] = useState({});

  const loadCells = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.Cell.list('-created_date', 200);
    setCells(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadCells(); }, [loadCells]);

  const { refreshing } = usePullToRefresh(loadCells);

  const filtered = cells.filter(c =>
    (c.name || 'Unnamed Cell').toLowerCase().includes(search.toLowerCase())
  );

  async function handleToggle(cell) {
    await base44.entities.Cell.update(cell.id, { visible: !cell.visible });
    setCells(prev => prev.map(c => c.id === cell.id ? { ...c, visible: !cell.visible } : c));
  }

  async function handleRecalculate(cell) {
    setRecalculating(prev => ({ ...prev, [cell.id]: true }));
    try {
      const points = JSON.parse(cell.points);
      const result = await queryMileage(points);
      if (result) {
        await base44.entities.Cell.update(cell.id, { adopted_m: result.adoptedM, unadopted_m: result.unadoptedM });
        setCells(prev => prev.map(c => c.id === cell.id ? { ...c, adopted_m: result.adoptedM, unadopted_m: result.unadoptedM } : c));
      }
    } finally {
      setRecalculating(prev => ({ ...prev, [cell.id]: false }));
    }
  }

  async function handleDelete(cell) {
    await base44.entities.Cell.delete(cell.id);
    setCells(prev => prev.filter(c => c.id !== cell.id));
  }

  function handleSelect(cell) {
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
      {/* Header */}
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

      {/* Search */}
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
      </div>

      {/* List */}
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
          <div
            key={cell.id}
            className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
          >
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
                <div className="text-xs text-muted-foreground mt-0.5">
                  {cell.area && <span className="mr-2">{cell.area}</span>}
                  {(() => { try { return JSON.parse(cell.points).length + ' pts'; } catch { return ''; } })()}
                  {cell.adopted_m != null && (
                    <span className="ml-2 text-blue-600 font-medium">{(((cell.adopted_m + (cell.unadopted_m||0)) / 1609.34) * 2).toFixed(2)} mi</span>
                  )}
                </div>
              </div>
              <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180 flex-shrink-0" />
            </button>
            <div className="flex border-t border-border">
            <button
              onClick={() => handleToggle(cell)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
            >
              {cell.visible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {cell.visible !== false ? 'Visible' : 'Hidden'}
            </button>
            <div className="w-px bg-border" />
            <button
              onClick={() => handleRecalculate(cell)}
              disabled={recalculating[cell.id]}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${recalculating[cell.id] ? 'animate-spin' : ''}`} />
              {recalculating[cell.id] ? 'Calculating…' : 'Recalc Miles'}
            </button>
            <div className="w-px bg-border" />
            <button
              onClick={() => handleDelete(cell)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}