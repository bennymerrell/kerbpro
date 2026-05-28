import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const apiKey = Deno.env.get('OS_MAPS_API_KEY');
    const url = `https://api.os.uk/features/v1/wfs?service=WFS&version=2.0.0&request=GetCapabilities&key=${apiKey}`;
    const res = await fetch(url);
    const text = await res.text();

    // Extract TypeName entries (various namespace prefixes)
    const matches = [...text.matchAll(/<(?:wfs:)?Name>([^<]+)<\/(?:wfs:)?Name>/g)].map(m => m[1]);

    return Response.json({ status: res.status, typeNames: matches, raw: text.substring(0, 2000) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});