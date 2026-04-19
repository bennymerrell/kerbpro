import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_FROM = Deno.env.get('TWILIO_FROM_NUMBER');

async function sendSMS(to, body) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const form = new URLSearchParams({ To: to, From: TWILIO_FROM, Body: body });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });
  return res.ok;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // action: 'started' | 'completed'
    const { action, cellName, cellArea, managerId } = await req.json();

    if (!action || !cellName || !managerId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch the assigned manager user record
    const allUsers = await base44.asServiceRole.entities.User.list();
    const manager = allUsers.find(u => u.id === managerId);

    if (!manager) {
      return Response.json({ error: 'Manager not found' }, { status: 404 });
    }

    const userName = user.full_name || user.email;
    const actionLabel = action === 'started' ? 'started work on' : 'completed';
    const cellDesc = cellArea ? `${cellName} (${cellArea})` : cellName;

    const message = `Kerb Update: ${userName} has ${actionLabel} cell ${cellDesc}.`;

    const emailBody = `
      <p>Hi ${manager.full_name || manager.email},</p>
      <p><strong>${userName}</strong> has <strong>${actionLabel}</strong> cell <strong>${cellDesc}</strong>.</p>
      <p>This is an automated notification from Kerb.</p>
    `;

    const results = { email: false, sms: false };

    // Send email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: manager.email,
      subject: `Kerb: ${userName} ${actionLabel} ${cellDesc}`,
      body: emailBody,
    });
    results.email = true;

    // Send SMS/WhatsApp if manager has a phone number
    if (manager.phone && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM) {
      results.sms = await sendSMS(manager.phone, message);
    }

    return Response.json({ ok: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});