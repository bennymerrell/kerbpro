const QUEUE_KEY = 'kerb_pending_sightings';

export function getPendingQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addToQueue(sighting) {
  const queue = getPendingQueue();
  const entry = { ...sighting, _queuedAt: new Date().toISOString(), _id: crypto.randomUUID() };
  queue.push(entry);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return entry;
}

export function removeFromQueue(id) {
  const queue = getPendingQueue().filter(s => s._id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}