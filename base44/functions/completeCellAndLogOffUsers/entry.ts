import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

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

    // Notify manager if provided
    if (managerId) {
      try {
        const manager = await base44.asServiceRole.entities.User.get(managerId);
        if (manager) {
          const userName = user.full_name || user.email;
          const cellDesc = cellArea ? `${cellName} (${cellArea})` : cellName;
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: manager.email,
            subject: `Kerb: ${userName} completed ${cellDesc}`,
            body: `<p>Hi ${manager.full_name || manager.email},</p><p><strong>${userName}</strong> has <strong>completed</strong> cell <strong>${cellDesc}</strong>.</p><p>${usersOnCell.length > 1 ? `${usersOnCell.length} users have been automatically logged off this cell.` : ''}</p><p>This is an automated notification from Kerb.</p>`,
          });
        }
      } catch {}
    }

    return Response.json({ ok: true, loggedOffCount: usersOnCell.length });
  } catch (error) {
    console.error('completeCellAndLogOffUsers error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});