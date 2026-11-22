export const ESCAPE_THRESHOLD = 40;

const CITIES = [
  { name: "Warszawa", lat: 52.2297, lng: 21.0122 },
  { name: "Gdańsk", lat: 54.352, lng: 18.6466 },
  { name: "Poznań", lat: 52.4064, lng: 16.9252 },
  { name: "Wrocław", lat: 51.1079, lng: 17.0385 },
  { name: "Katowice", lat: 50.2649, lng: 19.0238 },
  { name: "Szczecin", lat: 53.4285, lng: 14.5528 },
  { name: "Białystok", lat: 53.1325, lng: 23.1688 },
];

export function escapeChance(satisfaction) {
  const value = Number(satisfaction);
  if (!Number.isFinite(value) || value >= ESCAPE_THRESHOLD) return 0;
  return Math.min(1, (ESCAPE_THRESHOLD - Math.max(0, value)) / ESCAPE_THRESHOLD);
}

function roll(seed) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

export function applyEscapes(items, { simMinutes = 0 } = {}) {
  const day = Math.floor(Number(simMinutes || 0) / 1440);

  return (items || []).map((item) => {
    const chance = escapeChance(item.vehicle?.satisfaction);
    if (chance <= 0) return item;
    if (roll(`${item.vehicle.id}:${day}`) >= chance) return item;

    const city = CITIES[Math.floor(roll(`${item.vehicle.id}:city`) * CITIES.length) % CITIES.length];

    return {
      ...item,
      escaped: true,
      state: {
        ...item.state,
        lat: city.lat,
        lng: city.lng,
        phase: "escaped",
        destination: `UCIECZKA · ${city.name}`,
      },
    };
  });
}
