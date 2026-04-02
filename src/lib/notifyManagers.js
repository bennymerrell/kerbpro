import { base44 } from '@/api/base44Client';

export async function notifyManagers(subject, htmlBody) {
  await base44.functions.invoke('notifyManagers', { subject, body: htmlBody });
}