import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'manager') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, newCellId } = await req.json();
    if (!userId || !newCellId) return Response.json({ error: 'Missing userId or newCellId' }, { status: 400 });

    const targetUser = await base44.asServiceRole.entities.User.get(userId);
    if (!targetUser) return Response.json({ error: 'User not found' }, { status: 404 });

    const newCell = await base44.asServiceRole.entities.Cell.get(newCellId);
    if (!newCell) return Response.json({ error: 'Cell not found' }, { status: 404 });

    const cellDesc = newCell.area ? `${newCell.area} — ${newCell.name || 'Unnamed Cell'}` : (newCell.name || 'Unnamed Cell');
    const managerName = user.full_name || user.email;
    const today = new Date().toISOString().split('T')[0];

    // Reassign the user
    await base44.asServiceRole.entities.User.update(userId, {
      active_cell_id: newCellId,
      active_cell_checkin_date: today,
    });

    // Mark the new cell as in_progress if not already
    if (newCell.work_status !== 'in_progress') {
      await base44.asServiceRole.entities.Cell.update(newCellId, { work_status: 'in_progress' });
    }

    // Notify the user by email (if communications enabled)
    if (targetUser.communications_enabled !== false) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: targetUser.email,
        subject: `KerbPro: You have been reassigned to ${cellDesc}`,
        body: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
<tr><td style="background:#2563eb;padding:28px 32px;">
  <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">🔄 Cell Reassignment</p>
</td></tr>
<tr><td style="padding:28px 32px;">
  <p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi ${targetUser.full_name || targetUser.email},</p>
  <p style="margin:0 0 16px;font-size:15px;color:#374151;">You have been reassigned to cell <strong>${cellDesc}</strong> by <strong>${managerName}</strong>.</p>
  <p style="margin:0 0 24px;font-size:15px;color:#374151;">Please open the KerbPro app to continue working in your new cell.</p>
  <p style="margin:0;font-size:13px;color:#9ca3af;">This is an automated notification from KerbPro.</p>
</td></tr>
</table></td></tr></table></body></html>`,
      }).catch(() => {});
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('reassignUserCell error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});