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

    if (manager.communications_enabled === false) {
      return Response.json({ ok: true, note: 'Communications disabled for this manager' });
    }

    const userName = user.full_name || user.email;
    const cellDesc = cellArea ? `${cellArea} — ${cellName}` : cellName;
    const recordedAt = new Date().toLocaleString();
    const htmlBody = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);"><tr><td style="background:#1d4ed8;padding:28px 32px;"><p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">🚀 Cell Started</p><p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Started on ${recordedAt}</p></td></tr><tr><td style="padding:28px 32px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:10px 14px;background:#f8fafc;border-radius:8px;border-left:4px solid #1d4ed8;"><p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;">Cell</p><p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${cellDesc}</p></td></tr><tr><td style="height:12px;"></td></tr><tr><td style="padding:10px 14px;background:#f8fafc;border-radius:8px;border-left:4px solid #1d4ed8;"><p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;">Worker</p><p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${userName}</p></td></tr></table></td></tr><tr><td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;">Sent automatically from the KerbPro field mapping tool.</p></td></tr></table></td></tr></table></body></html>`;

    await base44.asServiceRole.functions.invoke('notifyManagers', {
      subject: `Cell Started: ${cellArea} — ${cellName}`,
      body: htmlBody,
      templateKey: 'cell_started',
      templateVars: { cell_name: cellName, cell_area: cellArea || '', worker: userName },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('notifyCellAction error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});