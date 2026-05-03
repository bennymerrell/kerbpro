import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { subject, body } = await req.json();

  const allUsers = await base44.asServiceRole.entities.User.list();
  const toSend = allUsers.filter(u => (u.role === 'manager' || u.role === 'admin') && u.communications_enabled !== false);

  if (toSend.length === 0) {
    return Response.json({ sent: 0, note: 'No managers or admins with communications enabled found' });
  }

  await Promise.all(
    toSend.map(u =>
      base44.asServiceRole.integrations.Core.SendEmail({ to: u.email, subject, body })
    )
  );

  return Response.json({ sent: toSend.length });
});