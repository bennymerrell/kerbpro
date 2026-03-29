const DB_NAME = 'MapCacheDB';
const DB_VERSION = 1;
const STORES = {
  TILES: 'tiles',
  CELLS: 'cells',
  SIGHTINGS: 'sightings',
};

let db = null;

function getDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (e) => {
      const database = e.target.result;
      
      if (!database.objectStoreNames.contains(STORES.TILES)) {
        const tileStore = database.createObjectStore(STORES.TILES, { keyPath: 'url' });
        tileStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!database.objectStoreNames.contains(STORES.CELLS)) {
        database.createObjectStore(STORES.CELLS, { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains(STORES.SIGHTINGS)) {
        database.createObjectStore(STORES.SIGHTINGS, { keyPath: 'id' });
      }
    };
  });
}

export const indexedDBCache = {
  // Tiles
  async cacheTile(url, imageData) {
    try {
      const database = await getDB();
      const tx = database.transaction([STORES.TILES], 'readwrite');
      const store = tx.objectStore(STORES.TILES);
      await store.put({
        url,
        data: imageData,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.warn('Failed to cache tile:', e);
    }
  },

  async getTile(url) {
    try {
      const database = await getDB();
      const tx = database.transaction([STORES.TILES], 'readonly');
      const store = tx.objectStore(STORES.TILES);
      return new Promise((resolve, reject) => {
        const request = store.get(url);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result?.data || null);
      });
    } catch (e) {
      return null;
    }
  },

  // Cells
  async cacheCells(cells) {
    try {
      const database = await getDB();
      const tx = database.transaction([STORES.CELLS], 'readwrite');
      const store = tx.objectStore(STORES.CELLS);
      cells.forEach(cell => store.put(cell));
    } catch (e) {
      console.warn('Failed to cache cells:', e);
    }
  },

  async getCells() {
    try {
      const database = await getDB();
      const tx = database.transaction([STORES.CELLS], 'readonly');
      const store = tx.objectStore(STORES.CELLS);
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
      });
    } catch (e) {
      return [];
    }
  },

  async cacheCell(cell) {
    try {
      const database = await getDB();
      const tx = database.transaction([STORES.CELLS], 'readwrite');
      const store = tx.objectStore(STORES.CELLS);
      await store.put(cell);
    } catch (e) {
      console.warn('Failed to cache cell:', e);
    }
  },

  // Sightings
  async cacheSightings(sightings) {
    try {
      const database = await getDB();
      const tx = database.transaction([STORES.SIGHTINGS], 'readwrite');
      const store = tx.objectStore(STORES.SIGHTINGS);
      sightings.forEach(sighting => store.put(sighting));
    } catch (e) {
      console.warn('Failed to cache sightings:', e);
    }
  },

  async getSightings() {
    try {
      const database = await getDB();
      const tx = database.transaction([STORES.SIGHTINGS], 'readonly');
      const store = tx.objectStore(STORES.SIGHTINGS);
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
      });
    } catch (e) {
      return [];
    }
  },

  async cacheSighting(sighting) {
    try {
      const database = await getDB();
      const tx = database.transaction([STORES.SIGHTINGS], 'readwrite');
      const store = tx.objectStore(STORES.SIGHTINGS);
      await store.put(sighting);
    } catch (e) {
      console.warn('Failed to cache sighting:', e);
    }
  },

  // Clear all
  async clearAll() {
    try {
      const database = await getDB();
      const tx = database.transaction([STORES.TILES, STORES.CELLS, STORES.SIGHTINGS], 'readwrite');
      tx.objectStore(STORES.TILES).clear();
      tx.objectStore(STORES.CELLS).clear();
      tx.objectStore(STORES.SIGHTINGS).clear();
    } catch (e) {
      console.warn('Failed to clear cache:', e);
    }
  },
};