import { distanceKm } from "@/lib/simulation";
import { getRoadPath } from "@/lib/server-fns";

const BROWSER_PROVIDERS = [
  "https://router.project-osrm.org/route/v1/driving/",
  "https://routing.openstreetmap.de/routed-car/route/v1/driving/",
];

export function pathDistanceKm(points) {
  if (!Array.isArray(points) || points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += distanceKm(points[i - 1], points[i]);
  }
  return total;
}

async function fetchDirect(points, continueStraight) {
  const coords = points.map((point) => `${point.lng.toFixed(6)},${point.lat.toFixed(6)}`).join(";");
  let lastError = null;

  for (const base of BROWSER_PROVIDERS) {
    try {
      const response = await fetch(
        `${base}${coords}?overview=full&geometries=geojson&continue_straight=${continueStraight === true}`,
        { headers: { Accept: "application/json" } }
      );
      if (!response.ok) throw new Error(`OSRM ${response.status}`);
      const payload = await response.json();
      const coordinates = payload?.routes?.[0]?.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) throw new Error("OSRM: brak trasy");
      return coordinates.map(([lng, lat]) => ({ lat, lng }));
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("OSRM: brak trasy");
}

/**
 * Wyznacza trasę po prawdziwych drogach (OSRM). Najpierw przez serwer aplikacji,
 * a w razie problemów bezpośrednio z przeglądarki.
 */
export async function fetchRoadPath(points, options = {}) {
  const clean = (Array.isArray(points) ? points : [])
    .map((point) => ({ lat: Number(point?.lat), lng: Number(point?.lng) }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));

  if (clean.length < 2) return [];

  const continueStraight = options.continueStraight === true;

  try {
    const geometry = await getRoadPath({ data: { points: clean, continueStraight } });
    if (Array.isArray(geometry) && geometry.length > 1) return geometry;
  } catch {
    /* poniżej próba bezpośrednia */
  }

  return fetchDirect(clean, continueStraight);
}

/** Dzieli geometrię w punkcie najbliższym wskazanemu miejscu (przystanek końcowy). */
export function splitPathAt(points, target) {
  if (!Array.isArray(points) || points.length < 2) return null;
  let best = Infinity;
  let index = -1;
  points.forEach((point, i) => {
    const d = (point.lat - target.lat) ** 2 + (point.lng - target.lng) ** 2;
    if (d < best) {
      best = d;
      index = i;
    }
  });
  if (index <= 0 || index >= points.length - 1) return null;
  return { before: points.slice(0, index + 1), after: points.slice(index) };
}
