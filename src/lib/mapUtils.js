// Haversine formula for calculating distance between two lat/lng points
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// Calculate total distance of a route (array of {lat, lng} points)
export function calculateTotalDistance(waypoints) {
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    total += haversineDistance(
      waypoints[i - 1].lat, waypoints[i - 1].lng,
      waypoints[i].lat, waypoints[i].lng
    );
  }
  return total;
}

// Format distance nicely
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  if (km < 10) {
    return `${km.toFixed(2)} km`;
  }
  return `${km.toFixed(1)} km`;
}

// Format distance in miles
export function formatDistanceMiles(meters) {
  const miles = meters / 1609.344;
  if (miles < 0.1) {
    const yards = meters * 1.09361;
    return `${Math.round(yards)} yd`;
  }
  if (miles < 10) {
    return `${miles.toFixed(2)} mi`;
  }
  return `${miles.toFixed(1)} mi`;
}

// Calculate segment distances
export function getSegmentDistances(waypoints) {
  const segments = [];
  for (let i = 1; i < waypoints.length; i++) {
    segments.push(
      haversineDistance(
        waypoints[i - 1].lat, waypoints[i - 1].lng,
        waypoints[i].lat, waypoints[i].lng
      )
    );
  }
  return segments;
}

// Tile layer configurations
export const TILE_LAYERS = {
  osm: {
    name: "Standard",
    url: "https://api.os.uk/maps/raster/v1/zxy/Outdoor_3857/{z}/{x}/{y}.png?key=7WyHISIynrtLqpEErdgi0CSfalJaux6I",
    attribution: 'Contains OS data &copy; Crown copyright and database rights 2024',
    maxZoom: 20,
    tileSize: 512,
    zoomOffset: -1,
  },
  satellite: {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 21,
  },
  terrain: {
    name: "Terrain",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
    maxZoom: 19,
  },
};