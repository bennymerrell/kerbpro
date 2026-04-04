import { useState } from 'react';
import { Loader2, SquareDashedBottom, AlertCircle, X } from 'lucide-react';
import { notifyManagers } from '../../lib/notifyManagers';
import { formatDistanceMiles } from '../../lib/mapUtils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";

function haversineSegment(a, b) {
  const R = 6371000;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function wayLength(nodes) {
  let d = 0;
  for (let i = 1; i < nodes.length; i++) d += haversineSegment([nodes[i - 1].lat, nodes[i - 1].lon], [nodes[i].lat, nodes[i].lon]);
  return d;
}

const ADOPTED_TAGS = ['motorway','trunk','primary','secondary','tertiary','unclassified','residential','motorway_link','trunk_link','primary_link','secondary_link','tertiary_link','living_street'];

async function queryOverpass(polygon) {
  const polyStr = polygon.map(p => `${p.lat} ${p.lng}`).join(' ');
  const roadFilter = 'motorway|trunk|primary|secondary|tertiary|unclassified|residential|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link|living_street';
  const query = `[out:json][timeout:90][maxsize:536870912];(way["highway"~"^(${roadFilter})$"](poly:"${polyStr}"););out geom;`;
  const encoded = encodeURIComponent(query);

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 95000);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encoded}`,
        signal: controller.signal,
      });
      clearTimeout(timer);
      const text = await res.text();
      if (!text.trim().startsWith('<')) return JSON.parse(text).elements || [];
    } catch {}
  }

  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent('https://overpass-api.de/api/interpreter')}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 95000);
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encoded}`,
      signal: controller.signal,
    });
    clearTimeout(timer);
    const text = await res.text();
    if (!text.trim().startsWith('<')) return JSON.parse(text).elements || [];
  } catch {}

  return null;
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

    const ways = await queryOverpass(points);

    if (ways !== null) {
      let adoptedM = 0;

      ways.forEach(way => {
        const tag = way.tags?.highway || '';
        const nodes = way.geometry || [];
        const len = wayLength(nodes);
        if (ADOPTED_TAGS.includes(tag)) adoptedM += len;
      });

      onUnadoptedRoads([]);
      setResults({ adoptedM, unadoptedM: 0, total: adoptedM, source: 'osm' });
    } else {
      const coordList = points.map(p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(' | ');
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          model: 'gemini_3_flash',
          prompt: `Using OpenStreetMap data, estimate the total length in metres of adopted roads (motorway, trunk, primary, secondary, tertiary, unclassified, residential, living_street) and unadopted roads (service, track, road) within the polygon defined by these lat,lng coordinates: ${coordList}. Return JSON with adoptedM (number) and unadoptedM (number).`,
          add_context_from_internet: true,
          response_json_schema: {
            type: 'object',
            properties: {
              adoptedM: { type: 'number' },
              unadoptedM: { type: 'number' },
            },
          },
        });
        const { adoptedM = 0, unadoptedM = 0 } = result;
        setResults({ adoptedM, unadoptedM, total: adoptedM + unadoptedM, source: 'ai' });
      } catch (e) {
        setError('Could not reach mapping servers. Please check your connection and try again.');
      }
    }
    setLoading(false);
  }

  if (!closed || points.length < 3) return null;

  return (
    <div className="fixed inset-0 z-[4000] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border w-full max-w-sm flex flex-col" style={{ maxHeight: 'calc(90dvh - env(safe-area-inset-bottom, 0px) - 4rem)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
          <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <SquareDashedBottom className="h-4 w-4 text-indigo-600" />
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
                className="w-full h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
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

          {/* Area */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Area</label>
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
            className="w-full h-9 text-sm bg-indigo-600 hover:bg-indigo-700"
          >
            Save Cell
          </Button>

        </div>
      </div>
    </div>
  );
}