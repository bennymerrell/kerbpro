import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get('OS_MAPS_API_KEY');
    const bbox = '-1.32,51.49,-1.28,51.52,EPSG:4326';
    const typeName = 'osfeatures:Highways_RoadLink';

    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeNames: typeName,
      outputFormat: 'GEOJSON',
      srsName: 'EPSG:4326',
      count: '5',
      key: apiKey,
    });

    const res = await fetch(`https://api.os.uk/features/v1/wfs?${params}`);
    const text = await res.text();

    return Response.json({ status: res.status, body: text.substring(0, 3000) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});