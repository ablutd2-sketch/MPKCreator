import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PointSchema = z.object({ lat: z.number(), lng: z.number() });

const OSRM_PROVIDERS = [
  "https://router.project-osrm.org/route/v1/driving/",
  "https://routing.openstreetmap.de/routed-car/route/v1/driving/",
];

async function requestRoute(base, coords, continueStraight) {
  const response = await fetch(
    `${base}${coords}?overview=full&geometries=geojson&continue_straight=${continueStraight === true}`,
    { headers: { Accept: "application/json" } }
  );
  if (!response.ok) throw new Error(`OSRM ${response.status}`);

  const payload = await response.json();
  const coordinates = payload?.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    throw new Error("OSRM: nie znaleziono trasy po drogach");
  }
  return coordinates.map(([lng, lat]) => ({ lat, lng }));
}

export const getRoadPath = createServerFn({ method: "POST" })
  .validator(z.object({ points: z.array(PointSchema).min(2).max(60), continueStraight: z.boolean().optional() }))
  .handler(async ({ data }) => {
    const coords = data.points.map((point) => `${point.lng.toFixed(6)},${point.lat.toFixed(6)}`).join(";");

    let lastError = null;
    for (const base of OSRM_PROVIDERS) {
      try {
        return await requestRoute(base, coords, data.continueStraight);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("OSRM: nie udało się wyznaczyć trasy po drogach");
  });

export const searchPlaces = createServerFn({ method: "POST" })
  .validator(z.object({ query: z.string().trim().min(3).max(80) }))
  .handler(async ({ data }) => {
    const params = new URLSearchParams({
      q: data.query,
      format: "jsonv2",
      limit: "6",
      countrycodes: "pl",
      "accept-language": "pl",
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { Accept: "application/json", "User-Agent": "BusTrackerPL/1.0 (transit map)" },
    });
    if (!response.ok) throw new Error(`Nominatim ${response.status}`);

    const list = await response.json();
    return (Array.isArray(list) ? list : [])
      .map((item) => ({
        id: `${item.osm_type}-${item.osm_id}`,
        name: String(item.display_name || ""),
        lat: Number(item.lat),
        lng: Number(item.lon),
      }))
      .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  });
