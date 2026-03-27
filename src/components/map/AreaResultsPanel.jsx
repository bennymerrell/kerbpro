import { useState } from 'react';
import { Loader2, SquareDashedBottom, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateTotalDistance, formatDistanceMiles, formatDistance } from '../../lib/mapUtils';
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

const ROAD_TAGS = ['motorway','trunk','primary','secondary','tertiary','unclassified','residential','motorway_link','trunk_link','primary_link','secondary_link','tertiary_link'];
const FOOTPATH_TAGS = ['footway','path','pedestrian','track','bridleway','cycleway','steps'];

async function queryOverpass(polygon) {
  const polyStr = polygon.map(p => `${p.lat} ${p.lng}`).join(' ');
  const query = `[out:json][timeout:25];(way["highway"](poly:"${polyStr}"););out body geom;`;
  const encoded = encodeURIComponent(query);

  const directEndpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  for (const url of directEndpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encoded}`,
      });
      const text = await res.text();
      if (!text.trim().startsWith('<')) {
        const data = JSON.parse(text);
        return data.elements || [];
      }
    } catch {}
  }

  // Try via CORS proxy
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent('https://overpass-api.de/api/interpreter')}`;
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encoded}`,
    });
    const text = await res.text();
    if (!text.trim().startsWith('<')) {
      const data = JSON.parse(text);
      return data.elements || [];
    }
  } catch {}

  return null; // signal to use LLM fallback
}

export default function AreaResultsPanel({ points, closed, onClearArea }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  async function handleCalculate() {
    setLoading(true);
    setError(null);
    setResults(null);

    const ways = await queryOverpass(points);

    if (ways !== null) {
      // Calculate from Overpass data
      let roadM = 0, footM = 0, otherM = 0;
      const breakdown = {};
      ways.forEach(way => {
        const tag = way.tags?.highway || 'unknown';
        const nodes = way.geometry || [];
        const len = wayLength(nodes);
        breakdown[tag] = (breakdown[tag] || 0) + len;
        if (ROAD_TAGS.includes(tag)) roadM += len;
        else if (FOOTPATH_TAGS.includes(tag)) footM += len;
        else otherM += len;
      });
      setResults({ roadM, footM, otherM, breakdown, total: roadM + footM + otherM, source: 'osm' });
      setLoading(false);
    } else {
      // LLM fallback with internet context
      const coordList = points.map(p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(' | ');
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Using OpenStreetMap data, estimate the total length in metres of:
1. Adopted roads (motorway, trunk, primary, secondary, tertiary, unclassified, residential) within the polygon defined by these coordinates: ${coordList}
2. Footpaths (footway, path, pedestrian, track, bridleway, cycleway) within the same polygon.

Return only a JSON object with keys: roadM (number, metres), footM (number, metres), breakdown (object mapping highway type to metres).`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            roadM: { type: 'number' },
            footM: { type: 'number' },
            breakdown: { type: 'object' },
          },
        },
      });
      const { roadM = 0, footM = 0, breakdown = {} } = result;
      setResults({ roadM, footM, otherM: 0, breakdown, total: roadM + footM, source: 'ai' });
      setLoading(false);
    }
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
            <div className="text-xs text-muted-foreground font-medium">Selected Area</div>
            <div className="text-xs text-foreground font-semibold">{points.length} points</div>
          </div>
          <button
            onClick={onClearArea}
            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            Clear
          </button>
        </div>

        <div className="p-3 space-y-2">
          {!results && !loading && (
            <button
              onClick={handleCalculate}
              className="w-full h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
            >
              Calculate Adopted Roads &amp; Footpaths
            </button>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Querying OpenStreetMap…
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
                  <div className="text-sm font-bold text-blue-800">{formatDistanceMiles(results.roadM)}</div>
                  <div className="text-[10px] text-blue-500">{formatDistance(results.roadM)}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-2.5">
                  <div className="text-[10px] text-green-600 font-medium mb-0.5">Footpaths</div>
                  <div className="text-sm font-bold text-green-800">{formatDistanceMiles(results.footM)}</div>
                  <div className="text-[10px] text-green-500">{formatDistance(results.footM)}</div>
                </div>
              </div>
              <div className="bg-muted/60 rounded-lg px-3 py-2 flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-medium">Total highways</span>
                <span className="text-xs font-bold text-foreground">{formatDistanceMiles(results.total)}</span>
              </div>

              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1"
              >
                <span>Breakdown by type</span>
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {expanded && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {Object.entries(results.breakdown).sort((a, b) => b[1] - a[1]).map(([tag, m]) => (
                    <div key={tag} className="flex justify-between items-center text-[10px] px-1">
                      <span className="text-muted-foreground capitalize">{tag.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-foreground">{formatDistanceMiles(m)}</span>
                    </div>
                  ))}
                </div>
              )}

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
      </div>
    </div>
  );
}