import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALL_TAGS = ['motorway','trunk','primary','secondary','tertiary','unclassified','residential','motorway_link','trunk_link','primary_link','secondary_link','tertiary_link','living_street','service','track','road'];

function haversineSegment(a, b) {
  const R = 6371000;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function wayLength(nodes) {
  let d = 0;
  for (let i = 1; i < nodes.length; i++) {
    d += haversineSegment([nodes[i - 1].lat, nodes[i - 1].lon], [nodes[i].lat, nodes[i].lon]);
  }
  return d;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { points } = await req.json();
    if (!points || points.length < 3) {
      return Response.json({ error: 'Need at least 3 points' }, { status: 400 });
    }

    // Simplify polygon if too many points
    const simplified = points.length > 60 ? points.filter((_, i) => i % Math.ceil(points.length / 60) === 0) : points;
    const polyStr = simplified.map(p => `${p.lat} ${p.lng}`).join(' ');
    const roadFilter = ALL_TAGS.join('|');
    // Increased timeout to 60s and maxsize to 64MB for larger cells
    const query = `[out:json][timeout:60][maxsize:67108864];(way["highway"~"^(${roadFilter})$"](poly:"${polyStr}"););out geom qt;`;

    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
      'https://overpass.openstreetmap.ru/api/interpreter',
    ];

    async function tryEndpoint(url) {
      const controller = new AbortController();
      // 70s fetch timeout — longer than the query timeout so the server has time to respond
      const timer = setTimeout(() => controller.abort(), 70000);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'KerbApp/1.0 (field-mapping-tool; contact@kerbpro.app)',
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        });
        clearTimeout(timer);
        const text = await res.text();
        const trimmed = text.trim();
        // Detect Overpass error responses (HTML or plain error text)
        if (!trimmed.startsWith('{')) {
          const statusMsg = res.status !== 200 ? ` (HTTP ${res.status})` : '';
          throw new Error(`Non-JSON response${statusMsg}`);
        }
        const parsed = JSON.parse(trimmed);
        // Overpass can return JSON with a remark indicating an error
        if (parsed.remark && parsed.remark.toLowerCase().includes('error')) {
          throw new Error(`Overpass error: ${parsed.remark}`);
        }
        return parsed.elements || [];
      } catch (e) {
        clearTimeout(timer);
        throw new Error(`${url}: ${e.message}`);
      }
    }

    // Try each endpoint sequentially — move to next on failure
    let ways = null;
    const errors = [];
    for (const endpoint of endpoints) {
      try {
        ways = await tryEndpoint(endpoint);
        break;
      } catch (e) {
        errors.push(e.message);
        console.warn('Overpass endpoint failed:', e.message);
      }
    }

    if (ways === null) {
      return Response.json({ error: `All Overpass servers failed. ${errors.join(' | ')}` }, { status: 502 });
    }

    let adoptedM = 0;
    const breakdown = {};
    const seenIds = new Set();
    ways.forEach(way => {
      if (seenIds.has(way.id)) return;
      seenIds.add(way.id);
      const tag = way.tags?.access === 'private' ? 'private' : (way.tags?.highway || '');
      const nodes = way.geometry || [];
      const len = wayLength(nodes);
      adoptedM += len;
      breakdown[tag] = (breakdown[tag] || 0) + len;
    });

    return Response.json({ adoptedM, unadoptedM: 0, wayCount: ways.length, breakdown });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});