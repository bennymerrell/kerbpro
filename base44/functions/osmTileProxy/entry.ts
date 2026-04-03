import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { z, x, y } = await req.json();
    if (z === undefined || x === undefined || y === undefined) {
      return Response.json({ error: 'Missing z, x, y params' }, { status: 400 });
    }

    const url = `https://a.tile.openstreetmap.fr/osmfr/${z}/${x}/${y}.png`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'KerbApp/1.0 (mapping tool)',
        'Referer': 'https://www.openstreetmap.org/',
      }
    });

    if (!response.ok) {
      return Response.json({ error: 'Tile fetch failed', status: response.status }, { status: 502 });
    }

    const buffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return Response.json({ base64 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});