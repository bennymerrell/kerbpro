import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'manager') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all cells that have points
    const cells = await base44.asServiceRole.entities.Cell.list('-created_date', 200);
    const eligible = cells.filter(c => c.points && c.points.length > 2);

    let processed = 0;
    let errors = 0;
    let skipped = 0;

    for (const cell of eligible) {
      try {
        let pts = [];
        try { pts = JSON.parse(cell.points); } catch { skipped++; continue; }
        if (pts.length < 3) { skipped++; continue; }

        // Mark as pending — the entity automation will pick it up
        await base44.asServiceRole.entities.Cell.update(cell.id, {
          recalc_status: 'pending',
          recalc_error: null,
        });
        processed++;
      } catch {
        errors++;
      }
    }

    return Response.json({ ok: true, processed, errors, skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});