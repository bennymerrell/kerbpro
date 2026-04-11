import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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
    const query = `[out:json][timeout:90][maxsize:536870912];(way["highway"~"^(${roadFilter})$"](poly:"${polyStr}");way["highway"]["access"="private"](poly:"${polyStr}"););out geom qt;`;

    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass.openstreetmap.ru/api/interpreter',
    ];

    async function tryEndpoint(url) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 95000);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        });
        clearTimeout(timer);
        const text = await res.text();
        if (!text.trim().startsWith('{')) throw new Error(`Non-JSON from ${url}`);
        return JSON.parse(text).elements || [];
      } catch (e) {
        clearTimeout(timer);
        throw new Error(`${url}: ${e.message}`);
      }
    }

    // Use Promise.any — resolves as soon as the FIRST endpoint succeeds
    let ways = null;
    let lastError = null;
    try {
      ways = await Promise.any(endpoints.map(tryEndpoint));
    } catch (aggErr) {
      lastError = aggErr.errors?.map(e => e.message).join(' | ');
    }

    if (ways === null) {
      return Response.json({ error: `All Overpass servers failed. Last error: ${lastError}` }, { status: 502 });
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