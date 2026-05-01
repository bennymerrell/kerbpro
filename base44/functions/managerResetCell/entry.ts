import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'manager') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { cellId } = await req.json();
    if (!cellId) return Response.json({ error: 'Missing cellId' }, { status: 400 });

    // Fetch cell details
    const cell = await base44.asServiceRole.entities.Cell.get(cellId);
    if (!cell) return Response.json({ error: 'Cell not found' }, { status: 404 });

    const cellDesc = cell.area ? `${cell.area} — ${cell.name || 'Unnamed Cell'}` : (cell.name || 'Unnamed Cell');
    const managerName = user.full_name || user.email;

    // Reset the cell
    await base44.asServiceRole.entities.Cell.update(cellId, {
      work_status: 'not_started',
      completed_at: null,
      completed_by: null,
    });

    // Find all users checked into this cell
    const allUsers = await base44.asServiceRole.entities.User.list();
    const usersOnCell = allUsers.filter(u => u.active_cell_id === cellId);

    const message = `You have been logged out of cell "${cellDesc}" by manager ${managerName}.`;

    // Log them off and set in-app notification flag
    await Promise.all(
      usersOnCell.map(u =>
        base44.asServiceRole.entities.User.update(u.id, {
          active_cell_id: '',
          active_cell_prev_status: '',
          active_cell_checkin_date: '',
          manager_logout_message: message,
        })
      )
    );

    // Send email to each logged-off user (if communications enabled)
    await Promise.all(
      usersOnCell
        .filter(u => u.communications_enabled !== false)
        .map(u =>
          base44.asServiceRole.integrations.Core.SendEmail({
            to: u.email,
            subject: `KerbPro: You have been logged out of ${cellDesc}`,
            body: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
<tr><td style="background:#f59e0b;padding:28px 32px;">
  <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">⚠️ Cell Reset by Manager</p>
</td></tr>
<tr><td style="padding:28px 32px;">
  <p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi ${u.full_name || u.email},</p>
  <p style="margin:0 0 16px;font-size:15px;color:#374151;">You have been logged out of cell <strong>${cellDesc}</strong> by <strong>${managerName}</strong>.</p>
  <p style="margin:0 0 24px;font-size:15px;color:#374151;">Please open the KerbPro app and log into a new cell to continue working.</p>
  <p style="margin:0;font-size:13px;color:#9ca3af;">This is an automated notification from KerbPro.</p>
</td></tr>
</table></td></tr></table></body></html>`,
          }).catch(() => {})
        )
    );

    return Response.json({ ok: true, loggedOffCount: usersOnCell.length });
  } catch (error) {
    console.error('managerResetCell error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});