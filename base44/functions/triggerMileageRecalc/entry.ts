import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { cellId } = await req.json();
    if (!cellId) return Response.json({ error: 'cellId required' }, { status: 400 });

    await base44.entities.Cell.update(cellId, {
      recalc_status: 'pending',
      recalc_error: null,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});