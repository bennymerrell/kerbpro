// Unified cache management for offline-first app

export const CacheManager = {
  // Register service worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
        });
        console.log('Service Worker registered successfully:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  },

  // Unregister and clear all caches
  async unregisterAndClear() {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
        
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((name) => caches.delete(name)));
        }
        console.log('Service Worker and caches cleared');
      } catch (error) {
        console.error('Error clearing Service Worker:', error);
      }
    }
  },

  // Check if app is online
  isOnline() {
    return navigator.onLine;
  },

  // Listen for online/offline changes
  onOnlineStatusChange(callback) {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
    return () => {
      window.removeEventListener('online', () => callback(true));
      window.removeEventListener('offline', () => callback(false));
    };
  },

  // Manually clear specific cache
  async clearCache(cacheName) {
    if ('caches' in window) {
      try {
        await caches.delete(cacheName);
        console.log(`Cache '${cacheName}' cleared`);
      } catch (error) {
        console.error(`Failed to clear cache '${cacheName}':`, error);
      }
    }
  },

  // Get cache size (approximate)
  async getCacheSize() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage,
          quota: estimate.quota,
          percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2),
        };
      } catch (error) {
        console.error('Failed to estimate storage:', error);
      }
    }
    return null;
  },

  // Request persistent storage
  async requestPersistentStorage() {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const persistent = await navigator.storage.persist();
        console.log('Persistent storage granted:', persistent);
        return persistent;
      } catch (error) {
        console.error('Failed to request persistent storage:', error);
      }
    }
    return false;
  },

  // Check if app is installable
  isInstallable() {
    return 'serviceWorker' in navigator && 'caches' in window;
  },
};