import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'manager' && user.role !== 'user') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { cellId, cellName, cellArea, managerId } = await req.json();
    if (!cellId) return Response.json({ error: 'Missing cellId' }, { status: 400 });

    const now = new Date().toISOString();

    // Mark the cell as completed
    await base44.asServiceRole.entities.Cell.update(cellId, {
      work_status: 'completed',
      completed_at: now,
      completed_by: user.email,
    });

    // Find all users who have this cell as their active cell and log them off
    const allUsers = await base44.asServiceRole.entities.User.list();
    const usersOnCell = allUsers.filter(u => u.active_cell_id === cellId);

    await Promise.all(
      usersOnCell.map(u =>
        base44.asServiceRole.entities.User.update(u.id, {
          active_cell_id: '',
          active_cell_prev_status: '',
          active_cell_checkin_date: '',
        })
      )
    );

    // Notify all managers via the notifyManagers function (supports email templates)
    try {
      const recordedAt = new Date().toLocaleString();
      const cellDesc = cellArea ? `${cellArea} — ${cellName}` : cellName;
      const userName = user.full_name || user.email;
      const htmlBody = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);"><tr><td style="background:#16a34a;padding:28px 32px;"><p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">✅ Cell Completed</p><p style="margin:6px 0 0;color:#bbf7d0;font-size:13px;">Completed on ${recordedAt}</p></td></tr><tr><td style="padding:28px 32px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:10px 14px;background:#f8fafc;border-radius:8px;border-left:4px solid #16a34a;"><p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;">Cell</p><p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${cellDesc}</p></td></tr><tr><td style="height:12px;"></td></tr><tr><td style="padding:10px 14px;background:#f8fafc;border-radius:8px;border-left:4px solid #16a34a;"><p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;">Worker</p><p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${userName}</p></td></tr></table></td></tr><tr><td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;">Sent automatically from the KerbPro field mapping tool.</p></td></tr></table></td></tr></table></body></html>`;
      await base44.asServiceRole.functions.invoke('notifyManagers', {
        subject: `Cell Completed: ${cellArea} — ${cellName}`,
        body: htmlBody,
        templateKey: 'cell_completed',
        templateVars: { cell_name: cellName, cell_area: cellArea || '', worker: userName },
      });
    } catch {}

    return Response.json({ ok: true, loggedOffCount: usersOnCell.length });
  } catch (error) {
    console.error('completeCellAndLogOffUsers error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});