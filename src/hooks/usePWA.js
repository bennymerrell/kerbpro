import { useEffect, useState } from 'react';
import { CacheManager } from '@/lib/cacheManager';

export default function usePWA() {
  const [isOnline, setIsOnline] = useState(true);
  const [cacheSize, setCacheSize] = useState(null);
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    // Register service worker
    CacheManager.registerServiceWorker().then((reg) => {
      if (reg) setSwRegistered(true);
    });

    // Track online status
    setIsOnline(navigator.onLine);
    const unsubscribe = CacheManager.onOnlineStatusChange((online) => {
      setIsOnline(online);
    });

    // Get cache size
    CacheManager.getCacheSize().then(setCacheSize);

    return () => {
      unsubscribe?.();
    };
  }, []);

  const clearCache = async (cacheName) => {
    await CacheManager.clearCache(cacheName);
    const newSize = await CacheManager.getCacheSize();
    setCacheSize(newSize);
  };

  const requestPersistent = async () => {
    return await CacheManager.requestPersistentStorage();
  };

  return {
    isOnline,
    cacheSize,
    swRegistered,
    clearCache,
    requestPersistent,
  };
}