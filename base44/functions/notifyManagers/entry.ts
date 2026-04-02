import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { subject, body } = await req.json();

    const managers = await base44.asServiceRole.entities.Manager.list();
    if (!managers || managers.length === 0) {
      return Response.json({ sent: 0 });
    }

    await Promise.all(
      managers.map(m =>
        base44.asServiceRole.integrations.Core.SendEmail({ to: m.email, subject, body })
      )
    );

    return Response.json({ sent: managers.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});