import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { cellId } = await req.json();
    const apiKey = Deno.env.get('OS_MAPS_API_KEY');

    const cells = await base44.asServiceRole.entities.Cell.filter({ id: cellId });
    const cell = cells[0];
    if (!cell) return Response.json({ error: 'Cell not found' }, { status: 404 });

    const points = JSON.parse(cell.points);
    const coordStr = points.map(p => `${p.lng} ${p.lat}`).join(',');
    const firstPt = points[0];
    const wkt = `POLYGON((${coordStr},${firstPt.lng} ${firstPt.lat}))`;
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    // OS uses lat/lon axis order for EPSG:4326
    const bboxStr = `${Math.min(...lats)},${Math.min(...lngs)},${Math.max(...lats)},${Math.max(...lngs)},EPSG:4326`;

    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeNames: 'osfeatures:Highways_RoadLink',
      outputFormat: 'GEOJSON',
      srsName: 'EPSG:4326',
      count: '10',
      bbox: bboxStr,
      key: apiKey,
    });

    const res = await fetch(`https://api.os.uk/features/v1/wfs?${params}`);
    const text = await res.text();

    let featureCount = 0;
    let totalLengthM = 0;
    let sample = [];
    try {
      const data = JSON.parse(text);
      featureCount = data.features?.length || 0;
      for (const f of (data.features || [])) {
        const l = parseFloat(f.properties?.Length);
        if (!isNaN(l)) totalLengthM += l;
        if (sample.length < 3) sample.push({ id: f.properties?.GmlID, length: f.properties?.Length, lengthUOM: f.properties?.LengthUOM });
      }
    } catch(e) {}

    return Response.json({
      status: res.status,
      featureCount,
      totalLengthM,
      totalLengthMi: (totalLengthM / 1609.34).toFixed(3),
      sample,
      wkt: wkt.substring(0, 300),
      rawSnippet: text.substring(0, 500),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});