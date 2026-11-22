import { buildCycle, departuresFor } from "@/lib/simulation";

const POLE_SUFFIX = /\s+\d{1,3}[a-z]?$/i;

/** Klucz przystanku: „Krzęcin Pętla 01" i „Krzęcin Pętla 02" to jeden przystanek. */
export function stopKey(name) {
  return String(name || "")
    .trim()
    .replace(POLE_SUFFIX, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function stopLabel(name) {
  return String(name || "")
    .trim()
    .replace(POLE_SUFFIX, "")
    .replace(/\s+/g, " ");
}

/** Wszystkie przystanki z linii, scalone po nazwie (słupki TAM i POWRÓT w jednym). */
export function collectStops(lines = []) {
  const map = new Map();

  (lines || []).forEach((line) => {
    (Array.isArray(line.stops) ? line.stops : []).forEach((stop) => {
      const key = stopKey(stop.name);
      if (!key) return;
      const entry = map.get(key) || { key, name: stopLabel(stop.name), lines: new Map() };
      entry.lines.set(line.id, line);
      map.set(key, entry);
    });
  });

  return [...map.values()]
    .map((entry) => ({ key: entry.key, name: entry.name, lines: [...entry.lines.values()] }))
    .sort((a, b) => a.name.localeCompare(b.name, "pl"));
}

function offsetsForPath(path, key, baseSec) {
  if (!path) return [];
  const direction = stopLabel(path.stops[path.stops.length - 1]?.name);
  const out = [];

  path.stops.forEach((stop, index) => {
    if (stopKey(stop.name) !== key) return;
    const leg = path.legs[index - 1];
    const offsetSec = index === 0 ? 0 : (leg?.t0 || 0) + (leg?.dur || 0);
    out.push({ offsetSec: baseSec + offsetSec, direction });
  });

  return out;
}

/** Odjazdy z przystanku we wszystkich kierunkach i liniach. */
export function stopDepartures({ lines = [], assignments = [], dayKey, key }) {
  const rows = [];

  (lines || []).forEach((line) => {
    const cycle = buildCycle(line);
    if (!cycle) return;

    const offsets = [
      ...offsetsForPath(cycle.tam, key, 0),
      ...(cycle.circuit ? [] : offsetsForPath(cycle.powrot, key, cycle.tam.duration + cycle.layover)),
    ];
    if (!offsets.length) return;

    (assignments || [])
      .filter((assignment) => assignment.line_id === line.id)
      .forEach((assignment) => {
        departuresFor(assignment, dayKey).forEach((departure) => {
          offsets.forEach(({ offsetSec, direction }) => {
            rows.push({ minutes: departure + offsetSec / 60, line, direction, brigade: assignment.brigade });
          });
        });
      });
  });

  return rows.sort((a, b) => a.minutes - b.minutes);
}

export function groupByHour(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const hour = Math.floor(row.minutes / 60) % 24;
    if (!map.has(hour)) map.set(hour, []);
    map.get(hour).push(row);
  });
  return [...map.entries()].map(([hour, items]) => ({ hour, items }));
}
