import { useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { getPendingQueue, removeFromQueue } from '@/lib/offlineQueue';

export default function useOfflineSync(onSynced) {
  const syncingRef = useRef(false);

  const syncQueue = useCallback(async () => {
    if (syncingRef.current) return;
    const queue = getPendingQueue();
    if (queue.length === 0) return;

    syncingRef.current = true;
    let syncedCount = 0;

    for (const entry of queue) {
      try {
        const { _id, _queuedAt, ...sightingData } = entry;
        await base44.entities.Sighting.create(sightingData);
        removeFromQueue(_id);
        syncedCount++;
      } catch {
        // Keep in queue, will retry next time
        break;
      }
    }

    syncingRef.current = false;
    if (syncedCount > 0 && onSynced) onSynced(syncedCount);
  }, [onSynced]);

  useEffect(() => {
    // Sync on initial load if online
    if (navigator.onLine) syncQueue();

    // Sync whenever connection is restored
    window.addEventListener('online', syncQueue);
    return () => window.removeEventListener('online', syncQueue);
  }, [syncQueue]);

  return { syncQueue };
}