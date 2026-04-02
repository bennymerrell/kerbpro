import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { subject, body } = await req.json();

  const managers = await base44.asServiceRole.entities.Manager.list();
  if (!managers || managers.length === 0) {
    return Response.json({ sent: 0 });
  }

  const allUsers = await base44.asServiceRole.entities.User.list();
  const registeredEmails = new Set(allUsers.map(u => u.email && u.email.toLowerCase()));

  const toSend = managers.filter(m => m.email && registeredEmails.has(m.email.toLowerCase()));

  if (toSend.length === 0) {
    return Response.json({ sent: 0, note: 'No managers with registered accounts found' });
  }

  await Promise.all(
    toSend.map(m =>
      base44.asServiceRole.integrations.Core.SendEmail({ to: m.email, subject, body })
    )
  );

  return Response.json({ sent: toSend.length });
});