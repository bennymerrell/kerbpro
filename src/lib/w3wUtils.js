const W3W_API_KEY = 'FEZ9G2DS';
const BASE = 'https://api.what3words.com/v3';

export function isW3WQuery(q) {
  return /^\/\/\/[a-z]+\.[a-z]+\.[a-z]+$/i.test(q.trim()) || /^[a-z]+\.[a-z]+\.[a-z]+$/i.test(q.trim());
}

export async function w3wToCoords(words) {
  const clean = words.replace(/^\/\/\//, '');
  const res = await fetch(`${BASE}/convert-to-coordinates?words=${encodeURIComponent(clean)}&key=${W3W_API_KEY}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { lat: data.coordinates.lat, lng: data.coordinates.lng, words: `///${data.words}`, nearestPlace: data.nearestPlace };
}

export async function coordsToW3W(lat, lng) {
  const res = await fetch(`${BASE}/convert-to-3wa?coordinates=${lat},${lng}&key=${W3W_API_KEY}`);
  const data = await res.json();
  if (data.error) return null;
  return `///${data.words}`;
}