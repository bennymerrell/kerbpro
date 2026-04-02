import { base44 } from '@/api/base44Client';

export async function notifyManagers(subject, htmlBody) {
  const managers = await base44.entities.Manager.list();
  if (!managers || managers.length === 0) return;
  await Promise.all(
    managers.map(m =>
      base44.integrations.Core.SendEmail({ to: m.email, subject, body: htmlBody })
    )
  );
}