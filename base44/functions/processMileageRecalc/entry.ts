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

    const body = await req.json();
    const cellId = body?.event?.entity_id || body?.cellId;
    if (!cellId) return Response.json({ error: 'cellId required' }, { status: 400 });

    // Mark as processing
    await base44.asServiceRole.entities.Cell.update(cellId, { recalc_status: 'processing' });

    const cell = (await base44.asServiceRole.entities.Cell.filter({ id: cellId }))[0];
    if (!cell) return Response.json({ error: 'Cell not found' }, { status: 404 });

    const points = JSON.parse(cell.points);
    const polyStr = points.map(p => `${p.lat} ${p.lng}`).join(' ');
    const roadFilter = ALL_TAGS.join('|');
    const query = `[out:json][timeout:90][maxsize:536870912];(way["highway"~"^(${roadFilter})$"](poly:"${polyStr}");way["highway"]["access"="private"](poly:"${polyStr}"););out geom;`;

    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass.openstreetmap.ru/api/interpreter',
    ];

    let ways = null;
    let lastError = null;

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 120000);
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
          lastError = `Non-JSON from ${url}: ${text.substring(0, 200)}`;
        }
      } catch (e) {
        lastError = `${url}: ${e.message}`;
      }
    }

    if (ways === null) {
      await base44.asServiceRole.entities.Cell.update(cellId, {
        recalc_status: 'error',
        recalc_error: `All Overpass servers failed. ${lastError}`,
      });
      return Response.json({ error: lastError }, { status: 502 });
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

    // Respect excluded road types when saving adoptedM
    let excludedTypes = [];
    try { excludedTypes = JSON.parse(cell.excluded_road_types || '[]'); } catch {}
    const includedM = Object.entries(breakdown)
      .filter(([t]) => !excludedTypes.includes(t))
      .reduce((s, [, m]) => s + m, 0);

    await base44.asServiceRole.entities.Cell.update(cellId, {
      adopted_m: includedM,
      unadopted_m: 0,
      road_breakdown: JSON.stringify(breakdown),
      recalc_status: 'done',
      recalc_error: null,
    });

    return Response.json({ ok: true, adoptedM: includedM, breakdown });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});