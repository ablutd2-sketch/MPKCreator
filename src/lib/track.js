export const TRAM_COLOR = "#8A8F98";

/**
 * Wygładza geometrię torowiska (algorytm Chaikina) — zamiast ostrych załamań
 * między punktami powstają płynne łuki.
 */
export function smoothPath(points = [], iterations = 2) {
  let result = (Array.isArray(points) ? points : [])
    .map((point) => [Number(point?.lat), Number(point?.lng)])
    .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

  if (result.length < 3) return result.map(([lat, lng]) => ({ lat, lng }));

  for (let pass = 0; pass < iterations; pass += 1) {
    const next = [result[0]];
    for (let i = 0; i < result.length - 1; i += 1) {
      const [lat1, lng1] = result[i];
      const [lat2, lng2] = result[i + 1];
      next.push([lat1 * 0.75 + lat2 * 0.25, lng1 * 0.75 + lng2 * 0.25]);
      next.push([lat1 * 0.25 + lat2 * 0.75, lng1 * 0.25 + lng2 * 0.75]);
    }
    next.push(result[result.length - 1]);
    result = next;
  }

  return result.map(([lat, lng]) => ({ lat, lng }));
}

export function trackPositions(points, tram) {
  const list = tram ? smoothPath(points) : points || [];
  return list.map((point) => [point.lat, point.lng]);
}
