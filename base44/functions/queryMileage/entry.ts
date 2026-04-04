import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ADOPTED_TAGS = ['motorway','trunk','primary','secondary','tertiary','unclassified','residential','motorway_link','trunk_link','primary_link','secondary_link','tertiary_link','living_street'];

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

    const polyStr = points.map(p => `${p.lat} ${p.lng}`).join(' ');
    const roadFilter = 'motorway|trunk|primary|secondary|tertiary|unclassified|residential|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link|living_street';
    const query = `[out:json][timeout:90][maxsize:536870912];(way["highway"~"^(${roadFilter})$"](poly:"${polyStr}"););out geom;`;

    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
    ];

    let ways = null;
    let lastError = null;

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 85000);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        });
        clearTimeout(timer);
        const text = await res.text();
        if (text.trim().startsWith('{')) {
          ways = JSON.parse(text).elements || [];
          break;
        } else {
          lastError = `Unexpected response from ${url}: ${text.substring(0, 200)}`;
        }
      } catch (e) {
        lastError = e.message;
      }
    }

    if (ways === null) {
      return Response.json({ error: `Overpass query failed: ${lastError}` }, { status: 502 });
    }

    let adoptedM = 0;
    ways.forEach(way => {
      const tag = way.tags?.highway || '';
      const nodes = way.geometry || [];
      const len = wayLength(nodes);
      if (ADOPTED_TAGS.includes(tag)) adoptedM += len;
    });

    return Response.json({ adoptedM, unadoptedM: 0, wayCount: ways.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});