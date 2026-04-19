import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action, officeId, data } = await req.json();

    if (action === 'list') {
      const offices = await base44.asServiceRole.entities.Office.list();
      return Response.json({ offices });
    }

    if (action === 'create') {
      if (!data?.name) return Response.json({ error: 'Name is required' }, { status: 400 });
      const office = await base44.asServiceRole.entities.Office.create(data);
      return Response.json({ office });
    }

    if (action === 'update') {
      if (!officeId) return Response.json({ error: 'officeId is required' }, { status: 400 });
      const office = await base44.asServiceRole.entities.Office.update(officeId, data);
      return Response.json({ office });
    }

    if (action === 'delete') {
      if (user.role !== 'admin') return Response.json({ error: 'Only admins can delete offices' }, { status: 403 });
      if (!officeId) return Response.json({ error: 'officeId is required' }, { status: 400 });
      await base44.asServiceRole.entities.Office.delete(officeId);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});