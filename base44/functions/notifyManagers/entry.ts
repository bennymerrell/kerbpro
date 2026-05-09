import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function applyPlaceholders(str, vars) {
  if (!str) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { subject, body, templateKey, templateVars } = await req.json();

  // Auto-inject worker name from the authenticated user
  const enrichedVars = {
    worker: user.full_name || user.email || '',
    ...(templateVars || {}),
  };

  // If a templateKey is provided, try to load a custom template
  let finalSubject = subject;
  let introOverride = null;

  if (templateKey) {
    const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ key: templateKey });
    if (templates[0]) {
      const t = templates[0];
      if (t.subject_template) {
        finalSubject = applyPlaceholders(t.subject_template, enrichedVars);
      }
      if (t.intro_text) {
        introOverride = applyPlaceholders(t.intro_text, enrichedVars);
      }
    }
  }

  // If introOverride, inject it into the body (replace the default heading paragraph)
  let finalBody = body;
  if (introOverride) {
    // Replace the text node inside the blue header <p> tag with the custom intro
    finalBody = body.replace(
      /(<td style="background:#1d4ed8[^>]*>)\s*(<p style="margin:0;color:#ffffff[^>]*>)[^<]*(<\/p>)/,
      `$1$2${introOverride}$3`
    );
  }

  const allUsers = await base44.asServiceRole.entities.User.list();
  const toSend = allUsers.filter(u => (u.role === 'manager' || u.role === 'admin') && u.communications_enabled !== false);

  if (toSend.length === 0) {
    return Response.json({ sent: 0, note: 'No managers or admins with communications enabled found' });
  }

  await Promise.all(
    toSend.map(u =>
      base44.asServiceRole.integrations.Core.SendEmail({ to: u.email, subject: finalSubject, body: finalBody, from_name: 'KerbPro' })
    )
  );

  return Response.json({ sent: toSend.length });
});