import { buildCycle, formatClock, parseTime } from "@/lib/simulation";

export const TAKT_OPTIONS = [10, 15, 20, 30, 60];

/**
 * Wylicza plan taktowy: czas cyklu (TAM + postój + POWRÓT), liczbę brygad
 * i odjazdy każdej brygady w wybranym przedziale godzinowym.
 */
export function buildTaktPlan({ line, firstTime, lastTime, takt, layoverMin }) {
  const cycle = buildCycle(line);
  if (!cycle) return { error: "Linia nie ma jeszcze trasy z co najmniej dwoma przystankami." };

  const first = parseTime(firstTime);
  const last = parseTime(lastTime);
  if (first == null || last == null) return { error: "Podaj poprawne godziny pierwszego i ostatniego odjazdu." };
  if (last <= first) return { error: "Ostatni odjazd musi być później niż pierwszy." };

  const taktMin = Math.max(5, Number(takt) || 15);
  const layover = Math.max(0, Number(layoverMin) || 0);
  const travelMin = (cycle.tam.duration + cycle.powrot.duration) / 60;
  const cycleMin = Math.max(1, Math.round(travelMin + layover));
  const count = Math.max(1, Math.ceil(cycleMin / taktMin));

  const brigades = [];
  for (let k = 0; k < count; k += 1) {
    const offset = k * taktMin;
    if (first + offset > last) break;
    const times = [];
    for (let minute = first + offset; minute <= last; minute += cycleMin) times.push(formatClock(minute));
    brigades.push({ number: `${line.number}-${String(k + 1).padStart(2, "0")}`, times });
  }

  return {
    travelMin,
    cycleMin,
    taktMin,
    layover,
    brigades,
    departures: brigades.reduce((sum, brigade) => sum + brigade.times.length, 0),
  };
}

const includesModel = (vehicle, needle) =>
  Boolean(needle) && String(vehicle?.model || "").toLowerCase().includes(needle);

/**
 * Dobiera wozy do brygad. Każdy wóz trafia najwyżej na jedną brygadę.
 */
export function assignVehiclesToBrigades({ mode, modelFilter, mix, manualIds, vehicles, count }) {
  const ids = [];

  if (mode === "manual") {
    return Array.from({ length: count }, (_, index) => manualIds[index] || "");
  }

  if (mode === "model") {
    const needle = String(modelFilter || "").trim().toLowerCase();
    const pool = vehicles.filter((vehicle) => includesModel(vehicle, needle));
    return Array.from({ length: count }, (_, index) => pool[index]?.id || "");
  }

  const entries = (Array.isArray(mix) ? mix : [])
    .map((entry) => ({ model: String(entry?.model || "").trim().toLowerCase(), percent: Number(entry?.percent) || 0 }))
    .filter((entry) => entry.model && entry.percent > 0);
  const sum = entries.reduce((total, entry) => total + entry.percent, 0) || 1;
  const counters = entries.map((entry) => ({ ...entry, weight: entry.percent / sum, used: 0 }));
  const taken = new Set();

  for (let index = 0; index < count; index += 1) {
    let target = null;
    let bestDeficit = -Infinity;
    counters.forEach((counter) => {
      const free = vehicles.some((vehicle) => !taken.has(vehicle.id) && includesModel(vehicle, counter.model));
      if (!free) return;
      const deficit = counter.weight - counter.used;
      if (deficit > bestDeficit) {
        bestDeficit = deficit;
        target = counter;
      }
    });

    let vehicle = null;
    if (target) vehicle = vehicles.find((entry) => !taken.has(entry.id) && includesModel(entry, target.model));
    if (!vehicle) vehicle = vehicles.find((entry) => !taken.has(entry.id));
    if (!vehicle) {
      ids.push("");
      continue;
    }

    if (target) target.used += 1;
    taken.add(vehicle.id);
    ids.push(vehicle.id);
  }

  return ids;
}
