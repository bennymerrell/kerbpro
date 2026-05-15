import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cellId } = await req.json();

    if (!cellId) {
      return Response.json({ error: 'cellId required' }, { status: 400 });
    }

    const prevStatus = 'not_started'; // We'll fetch if needed, but default to not_started
    await base44.asServiceRole.entities.Cell.update(cellId, { work_status: 'in_progress' });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});