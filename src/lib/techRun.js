/** Prostokątny obszar z dwóch klikniętych narożników. */
export function boundsFromCorners(a, b) {
  if (!a || !b) return null;
  return {
    south: Math.min(Number(a.lat), Number(b.lat)),
    north: Math.max(Number(a.lat), Number(b.lat)),
    west: Math.min(Number(a.lng), Number(b.lng)),
    east: Math.max(Number(a.lng), Number(b.lng)),
  };
}

export function pointInArea(point, area) {
  if (!point || !area) return false;
  const lat = Number(point.lat);
  const lng = Number(point.lng);
  return lat >= area.south && lat <= area.north && lng >= area.west && lng <= area.east;
}

function interpolate(a, b, t) {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

/**
 * Obszar wyznacza maksymalny zasięg przejazdu: trasa jedzie po drogach
 * i kończy się w miejscu, w którym dotyka granicy obszaru.
 */
export function clipPathToArea(path, area) {
  if (!Array.isArray(path) || !path.length || !area) return [];
  const firstOutside = path.findIndex((point) => !pointInArea(point, area));
  if (firstOutside === -1) return path;
  if (firstOutside === 0) return [];

  const lastInside = path[firstOutside - 1];
  const outside = path[firstOutside];
  let low = 0;
  let high = 1;
  let edge = lastInside;

  for (let i = 0; i < 14; i += 1) {
    const mid = (low + high) / 2;
    const probe = interpolate(lastInside, outside, mid);
    if (pointInArea(probe, area)) {
      edge = probe;
      low = mid;
    } else {
      high = mid;
    }
  }

  return [...path.slice(0, firstOutside), edge];
}

export function areaBounds(area) {
  if (!area) return null;
  return [
    [area.south, area.west],
    [area.north, area.east],
  ];
}
