import { useState } from 'react';
import { Loader2, SquareDashedBottom, AlertCircle, X } from 'lucide-react';
import { notifyManagers } from '../../lib/notifyManagers';
import { formatDistanceMiles } from '../../lib/mapUtils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";

async function queryOverpass(polygon) {
  const res = await base44.functions.invoke('queryMileage', { points: polygon });
  if (res.data?.error) return null;
  return [{ tags: { highway: '_computed' }, _adoptedM: res.data.adoptedM }];
}

export default function AreaResultsPanel({ points, closed, onClearArea, onUnadoptedRoads, onSaveCell }) {
  const [cellArea, setCellArea] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cellName, setCellName] = useState('');

  async function handleCalculate() {
    setLoading(true);
    setError(null);
    setResults(null);
    onUnadoptedRoads([]);

    try {
      const res = await base44.functions.invoke('queryMileage', { points });
      if (res.data?.error) throw new Error(res.data.error);
      const { adoptedM, unadoptedM } = res.data;
      onUnadoptedRoads([]);
      setResults({ adoptedM, unadoptedM: 0, total: adoptedM, source: 'osm' });
    } catch (e) {
      setError('Could not reach mapping servers. Please check your connection and try again.');
    }
    setLoading(false);
  }

  if (!closed || points.length < 3) return null;

  return (
    <div className="fixed inset-0 z-[4000] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border w-full max-w-sm flex flex-col" style={{ maxHeight: 'calc(90dvh - env(safe-area-inset-bottom, 0px) - 4rem)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <SquareDashedBottom className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground text-sm">Save Cell</h2>
            <p className="text-xs text-muted-foreground">{points.length} points selected</p>
          </div>
          <button onClick={onClearArea} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>

          {/* Road Mileage */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-2">Road Mileage</label>
            {!results && !loading && (
              <button
                onClick={handleCalculate}
                className="w-full h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
              >
                Calculate Road Mileage
              </button>
            )}
            {loading && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground bg-muted/40 rounded-lg">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Querying OpenStreetMap… (large areas may take up to 90s)
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {error}
              </div>
            )}
            {results && (
              <div className="space-y-2">
                <div className="bg-muted/60 rounded-lg px-3 py-2.5 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium">Total Spray</span>
                    <span className="text-[10px] text-muted-foreground/70">Total Roads</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-foreground">{formatDistanceMiles(results.total * 2)}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDistanceMiles(results.total)}</span>
                  </div>
                </div>
                {results.source === 'ai' && (
                  <div className="text-[10px] text-amber-600 text-center">⚠ AI estimate (OSM servers unavailable)</div>
                )}
                <button
                  onClick={() => { setResults(null); handleCalculate(); }}
                  className="w-full h-7 rounded-lg border border-border text-[10px] text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  Recalculate
                </button>
              </div>
            )}
          </div>

          {/* Contract */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Contract</label>
            <input
              type="text"
              value={cellArea}
              onChange={e => setCellArea(e.target.value)}
              placeholder="e.g. North District…"
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>

          {/* Cell Name */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Cell Name</label>
            <input
              type="text"
              value={cellName}
              onChange={e => setCellName(e.target.value)}
              placeholder="Cell name…"
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>

          <Button
            onClick={async () => {
              const name = cellName || 'Unnamed Cell';
              onSaveCell(name, cellArea, results);
              const totalMi = results ? ((results.total) / 1609.34).toFixed(2) : 'N/A';
              await notifyManagers(
                `New Cell Saved: ${name}`,
                `<p>A new cell <strong>${name}</strong> has been saved.</p><p>Area: ${cellArea || '—'}</p><p>Total road mileage: ${totalMi} mi</p>`
              );
            }}
            disabled={loading}
            className="w-full h-9 text-sm bg-emerald-600 hover:bg-emerald-700"
          >
            Save Cell
          </Button>

        </div>
      </div>
    </div>
  );
}