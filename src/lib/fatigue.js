export const FATIGUE_LIMIT = 80;
export const FATIGUE_PER_HOUR = 4;

function offsetFor(id) {
  let hash = 2166136261;
  const seed = String(id || "");
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

/**
 * Zmęczenie rośnie z każdą godziną symulacji, a każdy autobus męczy się w swoim
 * tempie. W zajezdni autobus odpoczywa i ma 0%.
 */
export function effectiveFatigue(vehicle, simMinutes) {
  if (vehicle?.depot_sleep) return 0;
  const base = Number(vehicle?.fatigue ?? 0);
  const minutes = ((Number(simMinutes || 0) % 1440) + 1440) % 1440;
  const value = base + (minutes / 60) * FATIGUE_PER_HOUR + offsetFor(vehicle?.id) * 12;
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

export function isSleeping(vehicle, simMinutes) {
  if (vehicle?.depot_sleep) return false;
  return effectiveFatigue(vehicle, simMinutes) >= FATIGUE_LIMIT;
}

export const SATISFACTION_PER_HOUR = 1.2;

/** Zadowolenie spada samo z każdą godziną dnia; w zajezdni pojazd odpoczywa i wraca do 100%. */
export function effectiveSatisfaction(vehicle, simMinutes) {
  if (vehicle?.depot_sleep) return 100;
  const base = Number(vehicle?.satisfaction ?? 100);
  const minutes = ((Number(simMinutes || 0) % 1440) + 1440) % 1440;
  const value = base - (minutes / 60) * SATISFACTION_PER_HOUR;
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}
