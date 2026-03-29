import { useState } from 'react';
import { Loader2, SquareDashedBottom, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceMiles, formatDistance } from '../../lib/mapUtils';
import { base44 } from '@/api/base44Client';

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

// Adopted = maintained by local authority
const ADOPTED_TAGS = ['motorway','trunk','primary','secondary','tertiary','unclassified','residential','motorway_link','trunk_link','primary_link','secondary_link','tertiary_link','living_street'];
// Unadopted = not publicly maintained (private roads, service roads, tracks)
const UNADOPTED_TAGS = ['service','track','road'];

async function queryOverpass(polygon) {
  const polyStr = polygon.map(p => `${p.lat} ${p.lng}`).join(' ');
  // Only fetch the road types we need — massively reduces payload for large areas
  const roadFilter = 'motorway|trunk|primary|secondary|tertiary|unclassified|residential|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link|living_street|service|track|road';
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
  const [expanded, setExpanded] = useState(false);
  const [cellName, setCellName] = useState('');

  async function handleCalculate() {
    setLoading(true);
    setError(null);
    setResults(null);
    onUnadoptedRoads([]);

    const ways = await queryOverpass(points);

    if (ways !== null) {
      let adoptedM = 0, unadoptedM = 0;
      const unadoptedGeoms = [];

      ways.forEach(way => {
        const tag = way.tags?.highway || '';
        const nodes = way.geometry || [];
        const len = wayLength(nodes);

        if (ADOPTED_TAGS.includes(tag)) {
          adoptedM += len;
        } else if (UNADOPTED_TAGS.includes(tag)) {
          unadoptedM += len;
          unadoptedGeoms.push(nodes.map(n => [n.lat, n.lon]));
        }
      });

      onUnadoptedRoads(unadoptedGeoms);
      setResults({ adoptedM, unadoptedM, total: adoptedM + unadoptedM, source: 'osm' });
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
    <div className="absolute bottom-6 left-4 z-[1000] w-72">
      <div className="bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-3 border-b border-border/40">
          <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <SquareDashedBottom className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground font-medium">Selected Cell</div>
            <div className="text-xs text-foreground font-semibold">{points.length} points</div>
          </div>
          <button onClick={onClearArea} className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">Clear</button>
        </div>

        <div className="p-3 space-y-2">
          {/* 1. Calculate mileage */}
          {!results && !loading && (
            <button onClick={handleCalculate} className="w-full h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors">
              Calculate Road Mileage
            </button>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Querying OpenStreetMap… (large areas may take up to 90s)
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </div>
          )}

          {results && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 rounded-lg p-2.5">
                  <div className="text-[10px] text-blue-600 font-medium mb-0.5">Adopted Roads</div>
                  <div className="text-sm font-bold text-blue-800">{formatDistanceMiles(results.adoptedM)}</div>
                  <div className="text-[10px] text-blue-500">{formatDistance(results.adoptedM)}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-2.5">
                  <div className="text-[10px] text-red-600 font-medium mb-0.5">Unadopted Roads</div>
                  <div className="text-sm font-bold text-red-800">{formatDistanceMiles(results.unadoptedM)}</div>
                  <div className="text-[10px] text-red-500">{formatDistance(results.unadoptedM)}</div>
                </div>
              </div>
              <div className="bg-muted/60 rounded-lg px-3 py-2 flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-medium">Total roads</span>
                <span className="text-xs font-bold text-foreground">{formatDistanceMiles(results.total)}</span>
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

          {/* 2. Area text field */}
          <input
            type="text"
            value={cellArea}
            onChange={e => setCellArea(e.target.value)}
            placeholder="Area (e.g. North District)…"
            className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          {/* 3. Cell name + save */}
          <div className="flex gap-1.5">
            <input
              type="text"
              value={cellName}
              onChange={e => setCellName(e.target.value)}
              placeholder="Cell name…"
              className="flex-1 h-8 px-2 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => onSaveCell(cellName || 'Unnamed Cell', cellArea, results)}
              className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              Save Cell
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}