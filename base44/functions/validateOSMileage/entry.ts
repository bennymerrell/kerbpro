import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function haversine(a, b) {
  // OS EPSG:4326 returns [lat, lng]
  const R = 6371000;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function lineLength(coords) {
  let d = 0;
  for (let i = 1; i < coords.length; i++) d += haversine(coords[i - 1], coords[i]);
  return d;
}

async function fetchRoadLinks(bbox, apiKey) {
  const base = 'https://api.os.uk/features/v1/wfs';
  const pageSize = 100;
  let startIndex = 0;
  let totalM = 0;
  const seenIds = new Set();

  while (true) {
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeNames: 'osfeatures:Highways_RoadLink',
      outputFormat: 'GEOJSON',
      srsName: 'EPSG:4326',
      count: String(pageSize),
      startIndex: String(startIndex),
      bbox: bbox,
      key: apiKey,
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(`${base}?${params}`, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OS WFS error ${res.status}: ${text.substring(0, 400)}`);
    }

    const data = await res.json();
    const features = data.features || [];
    if (features.length === 0) break;

    for (const f of features) {
      const fid = f.id || f.properties?.gml_id || f.properties?.id;
      if (fid && seenIds.has(fid)) continue;
      if (fid) seenIds.add(fid);

      const geom = f.geometry;
      if (!geom) continue;
      if (geom.type === 'LineString') {
        totalM += lineLength(geom.coordinates);
      } else if (geom.type === 'MultiLineString') {
        for (const line of geom.coordinates) totalM += lineLength(line);
      }
    }

    if (features.length < pageSize) break;
    startIndex += pageSize;
    if (startIndex > 20000) break;
  }

  return totalM;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { cellId } = await req.json();
    if (!cellId) return Response.json({ error: 'cellId required' }, { status: 400 });

    const apiKey = Deno.env.get('OS_MAPS_API_KEY');
    if (!apiKey) return Response.json({ error: 'OS_MAPS_API_KEY secret not set' }, { status: 500 });

    const cells = await base44.asServiceRole.entities.Cell.filter({ id: cellId });
    const cell = cells[0];
    if (!cell) return Response.json({ error: 'Cell not found' }, { status: 404 });

    const points = JSON.parse(cell.points);
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    // OS WFS EPSG:4326 uses lat/lng axis order
    const bbox = `${minLat},${minLng},${maxLat},${maxLng},EPSG:4326`;

    const osTotalM = await fetchRoadLinks(bbox, apiKey);

    const osmM = cell.adopted_m || 0;
    const diff = osmM > 0 ? Math.abs(osTotalM - osmM) / osmM : 1;
    const status = diff <= 0.15 ? 'pass' : 'fail';

    await base44.asServiceRole.entities.Cell.update(cellId, {
      os_validated_m: osTotalM,
      os_validated_status: status,
      os_validated_at: new Date().toISOString(),
    });

    return Response.json({ osTotalM, osmM, status, diffPct: parseFloat((diff * 100).toFixed(1)) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});