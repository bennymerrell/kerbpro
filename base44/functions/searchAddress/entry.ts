import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query } = await req.json();
    if (!query || query.trim().length < 2) return Response.json({ results: [] });

    const apiKey = Deno.env.get('LOCATIONIQ_API_KEY');
    const url = `https://api.locationiq.com/v1/autocomplete?key=${apiKey}&q=${encodeURIComponent(query)}&limit=8&countrycodes=gb&dedupe=1`;

    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return Response.json({ results: [] });

    const data = await res.json();
    return Response.json({ results: Array.isArray(data) ? data : [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});