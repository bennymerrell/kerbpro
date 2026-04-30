import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, cellName, cellArea, managerId } = await req.json();

    if (!action || !cellName || !managerId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let manager;
    try {
      manager = await base44.asServiceRole.entities.User.get(managerId);
    } catch {
      return Response.json({ error: 'Manager not found' }, { status: 404 });
    }

    if (!manager) {
      return Response.json({ error: 'Manager not found' }, { status: 404 });
    }

    const userName = user.full_name || user.email;
    const actionLabel = action === 'started' ? 'started work on' : 'completed';
    const cellDesc = cellArea ? `${cellName} (${cellArea})` : cellName;

    const emailBody = `
      <p>Hi ${manager.full_name || manager.email},</p>
      <p><strong>${userName}</strong> has <strong>${actionLabel}</strong> cell <strong>${cellDesc}</strong>.</p>
      <p>This is an automated notification from KerbPro.</p>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: manager.email,
      subject: `KerbPro: ${userName} ${actionLabel} ${cellDesc}`,
      body: emailBody,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('notifyCellAction error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});