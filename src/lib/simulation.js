export const BUS_SPEED_KMH = 24;
export const DWELL_SEC = 30;
export const LAYOVER_SEC = 120;

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const DAY_LABELS = {
  mon: "Poniedziałek",
  tue: "Wtorek",
  wed: "Środa",
  thu: "Czwartek",
  fri: "Piątek",
  sat: "Sobota",
  sun: "Niedziela",
};

export const DAY_CHIPS = {
  mon: "Pon",
  tue: "Wt",
  wed: "Śr",
  thu: "Czw",
  fri: "Pt",
  sat: "Sob",
  sun: "Nd",
};

export const DAY_SHORT = {
  mon: "pon",
  tue: "wt",
  wed: "śr",
  thu: "czw",
  fri: "pt",
  sat: "sob",
  sun: "niedz",
};

const toRad = (deg) => (deg * Math.PI) / 180;

export function distanceKm(a, b) {
  const R = 6371;
  const dLat = toRad(Number(b.lat) - Number(a.lat));
  const dLon = toRad(Number(b.lng) - Number(a.lng));
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(Number(a.lat))) * Math.cos(toRad(Number(b.lat))) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function parseTime(value) {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function formatClock(minutes) {
  if (minutes == null || Number.isNaN(Number(minutes))) return "--:--";
  const total = ((Math.round(Number(minutes)) % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function normalizeStops(stops) {
  if (!Array.isArray(stops)) return [];
  return stops
    .map((stop) => {
      const lat = Number(stop?.lat);
      const lng = Number(stop?.lng);
      const backLat = Number(stop?.lat_back);
      const backLng = Number(stop?.lng_back);
      return {
        name: String(stop?.name || "").trim(),
        lat,
        lng,
        pole: String(stop?.pole || "01").trim() || "01",
        lat_back: Number.isFinite(backLat) ? backLat : lat,
        lng_back: Number.isFinite(backLng) ? backLng : lng,
        pole_back: String(stop?.pole_back || "02").trim() || "02",
        petla: Boolean(stop?.petla),
      };
    })
    .filter((stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng));
}

/** Linia okrężna: ostatni przystanek to ten sam punkt co pierwszy — trasa nie zawraca. */
export function isCircuitStops(rawStops) {
  const stops = normalizeStops(rawStops);
  if (stops.length < 3) return false;
  return distanceKm(stops[0], stops[stops.length - 1]) < 0.2;
}

function normalizeGeometry(geometry) {
  if (!Array.isArray(geometry)) return [];
  return geometry
    .map((point) => ({ lat: Number(point?.lat), lng: Number(point?.lng) }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
}

function pointAtDistance(points, cum, distance) {
  const total = cum[cum.length - 1];
  const target = Math.max(0, Math.min(total, distance));
  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= target) lo = mid;
    else hi = mid;
  }
  const span = cum[hi] - cum[lo];
  const ratio = span > 0 ? (target - cum[lo]) / span : 0;
  return {
    lat: points[lo].lat + (points[hi].lat - points[lo].lat) * ratio,
    lng: points[lo].lng + (points[hi].lng - points[lo].lng) * ratio,
  };
}

/**
 * Buduje trasę przejazdu. Jeśli linia ma geometrię OSRM, autobus jedzie
 * dokładnie po ulicach; w przeciwnym razie łączy przystanki odcinkami.
 */
export function buildPath(rawStops, rawGeometry, phase = "tam", layoverSec = LAYOVER_SEC) {
  const all = normalizeStops(rawStops);
  if (all.length < 2) return null;

  const ordered = phase === "powrot" ? [...all].reverse() : all;
  const stopPoints = ordered.map((stop) => ({
    lat: phase === "powrot" ? stop.lat_back : stop.lat,
    lng: phase === "powrot" ? stop.lng_back : stop.lng,
  }));

  let geometry = normalizeGeometry(rawGeometry);
  if (geometry.length >= 2) {
    const startOk = distanceKm(geometry[0], stopPoints[0]) < 0.8;
    const endOk = distanceKm(geometry[geometry.length - 1], stopPoints[stopPoints.length - 1]) < 0.8;
    if (!startOk || !endOk) geometry = [];
  }

  const line = geometry.length >= 2 ? geometry : stopPoints;
  const cum = [0];
  for (let i = 1; i < line.length; i += 1) {
    cum.push(cum[i - 1] + distanceKm(line[i - 1], line[i]));
  }
  const total = cum[cum.length - 1];
  if (!(total > 0)) return null;

  const stopDist = stopPoints.map((point, index) => {
    if (index === 0) return 0;
    if (index === stopPoints.length - 1) return total;
    let best = Infinity;
    let dist = 0;
    for (let i = 0; i < line.length; i += 1) {
      const d = distanceKm(point, line[i]);
      if (d < best) {
        best = d;
        dist = cum[i];
      }
    }
    return dist;
  });

  for (let i = 1; i < stopDist.length - 1; i += 1) {
    if (stopDist[i] <= stopDist[i - 1]) stopDist[i] = stopDist[i - 1] + 0.001;
    if (stopDist[i] >= total) stopDist[i] = total - 0.001;
  }
  if (stopDist.length > 2 && stopDist[stopDist.length - 1] <= stopDist[stopDist.length - 2]) {
    stopDist[stopDist.length - 1] = stopDist[stopDist.length - 2] + 0.001;
  }

  const legs = [];
  let t = 0;
  for (let i = 1; i < stopDist.length; i += 1) {
    const km = Math.max(0.001, stopDist[i] - stopDist[i - 1]);
    const duration = Math.max(15, (km / BUS_SPEED_KMH) * 3600);
    legs.push({ index: i, t0: t, dur: duration, d0: stopDist[i - 1], d1: stopDist[i] });
    t += duration;
    if (i < stopDist.length - 1) t += ordered[i].petla ? layoverSec : DWELL_SEC;
  }

  return {
    points: line,
    cum,
    stopDist,
    legs,
    duration: t,
    stops: ordered,
    onRoads: geometry.length >= 2,
  };
}

export function positionOnPath(path, elapsedSec) {
  const { legs, points, cum } = path;
  if (!legs.length) {
    const first = points[0];
    return { lat: first.lat, lng: first.lng, nextStop: 0 };
  }
  if (elapsedSec <= 0) {
    return { lat: points[0].lat, lng: points[0].lng, nextStop: legs[0].index };
  }
  if (elapsedSec >= path.duration) {
    const last = points[points.length - 1];
    return { lat: last.lat, lng: last.lng, nextStop: path.stops.length - 1 };
  }

  let leg = legs[0];
  for (let i = 0; i < legs.length; i += 1) {
    if (legs[i].t0 <= elapsedSec) leg = legs[i];
    else break;
  }

  const ratio = Math.max(0, Math.min(1, (elapsedSec - leg.t0) / (leg.dur || 1)));
  const distance = leg.d0 + (leg.d1 - leg.d0) * ratio;
  const point = pointAtDistance(points, cum, distance);
  return { lat: point.lat, lng: point.lng, nextStop: leg.index };
}

const cycleCache = new Map();

export function buildCycle(line) {
  if (!line?.id) return null;
  const key = `${line.id}|${line.updated_date || ""}|${(line.stops || []).length}|${(line.path_tam || []).length}|${
    (line.path_powrot || []).length
  }`;
  if (cycleCache.has(key)) return cycleCache.get(key);

  const stops = normalizeStops(line.stops);
  if (stops.length < 2) return null;

  const layover = Number(line?.layover_min) > 0 ? Math.round(Number(line.layover_min) * 60) : LAYOVER_SEC;

  const circuit = isCircuitStops(line.stops);
  const tam = buildPath(line.stops, line.path_tam, "tam", layover);
  const powrot = circuit
    ? buildPath(line.stops, line.path_tam, "tam", layover)
    : buildPath(line.stops, line.path_powrot, "powrot", layover);
  if (!tam || !powrot) return null;

  const cycle = {
    stops,
    tam,
    powrot,
    layover,
    circuit,
    total: tam.duration + layover + powrot.duration,
  };

  if (cycleCache.size > 120) cycleCache.clear();
  cycleCache.set(key, cycle);
  return cycle;
}

export function departuresFor(assignment, dayKey) {
  const list = assignment?.[dayKey];
  if (!Array.isArray(list)) return [];
  return list
    .map(parseTime)
    .filter((value) => value != null)
    .sort((a, b) => a - b);
}

function buildState(phase, path, position, cycle, departures, nowSec, line) {
  const stops = path.stops;
  const last = stops[stops.length - 1];
  const index = Math.min(position.nextStop ?? stops.length - 1, stops.length - 1);
  const next = stops[index] || last;
  const nextDeparture = departures.find((dep) => dep * 60 > nowSec);

  const first = cycle.stops[0];
  const finish = cycle.stops[cycle.stops.length - 1];
  const direction = phase === "tam" ? `${first.name} → ${finish.name}` : `${finish.name} → ${first.name}`;

  return {
    lat: position.lat,
    lng: position.lng,
    phase,
    directionLabel: cycle.circuit ? "KURS" : phase === "tam" ? "TAM" : "POWRÓT",
    direction,
    destination: last.name,
    nextStop: `${next.name} ${phase === "tam" ? next.pole : next.pole_back}`,
    nextDeparture: nextDeparture ?? null,
    lineColor: line?.color || "#14223B",
  };
}

const HOLD_GAP_SEC = 40;
const HOLD_BACK_KM = 0.12;

function legInfo({ assignment, line, simMinutes, dayKey }) {
  if (!assignment || !line || simMinutes == null || !dayKey) return null;
  const cycle = buildCycle(line);
  if (!cycle) return null;

  const departures = departuresFor(assignment, dayKey);
  if (!departures.length) return null;

  const nowSec = simMinutes * 60;

  for (let i = departures.length - 1; i >= 0; i -= 1) {
    const startSec = departures[i] * 60;
    if (nowSec < startSec) continue;
    if (nowSec > startSec + cycle.total) break;
    return { cycle, departures, nowSec, startSec, elapsed: nowSec - startSec };
  }

  return null;
}

function stateFromElapsed({ cycle, departures, nowSec, elapsed, line, held }) {
  if (elapsed <= cycle.tam.duration) {
    return buildState("tam", cycle.tam, positionOnPath(cycle.tam, elapsed), cycle, departures, nowSec, line);
  }

  const layoverEnd = cycle.tam.duration + cycle.layover;
  if (elapsed <= layoverEnd) {
    const path = cycle.tam;
    const lastIndex = path.stops.length - 1;
    const position = held
      ? {
          ...pointAtDistance(path.points, path.cum, Math.max(0, path.cum[path.cum.length - 1] - HOLD_BACK_KM)),
          nextStop: lastIndex,
        }
      : { lat: path.stops[lastIndex].lat, lng: path.stops[lastIndex].lng, nextStop: lastIndex };
    return buildState("tam", path, position, cycle, departures, nowSec, line);
  }

  return buildState(
    "powrot",
    cycle.powrot,
    positionOnPath(cycle.powrot, elapsed - layoverEnd),
    cycle,
    departures,
    nowSec,
    line
  );
}

export function vehicleStateAt({ assignment, line, simMinutes, dayKey }) {
  const info = legInfo({ assignment, line, simMinutes, dayKey });
  if (!info) return null;
  return stateFromElapsed({ ...info, line, held: false });
}

function matchesModel(vehicle, filter) {
  const needle = String(filter || "").trim().toLowerCase();
  if (!needle) return true;
  return String(vehicle?.model || "").toLowerCase().includes(needle);
}

/**
 * Przydziela pojazdy do brygad. Ręczne przypisania mają priorytet, a linie
 * w trybie model / udziały procentowe dobierają wolne wozy z taboru.
 */
export function resolveAssignments({ vehicles = [], lines = [], assignments = [] }) {
  const lineById = new Map((lines || []).map((line) => [line.id, line]));
  const used = new Set();
  const result = new Map();

  (assignments || []).forEach((assignment) => {
    if (!assignment?.vehicle_id) return;
    if (result.has(assignment.vehicle_id)) return;
    const line = lineById.get(assignment.line_id);
    if (!line) return;
    result.set(assignment.vehicle_id, { assignment, line });
    used.add(assignment.vehicle_id);
  });

  const autoByLine = new Map();
  (assignments || []).forEach((assignment) => {
    if (assignment?.vehicle_id) return;
    const line = lineById.get(assignment.line_id);
    if (!line) return;
    if (!autoByLine.has(line.id)) autoByLine.set(line.id, []);
    autoByLine.get(line.id).push(assignment);
  });

  autoByLine.forEach((list, lineId) => {
    const line = lineById.get(lineId);
    if (!line) return;
    const mode = line.assignment_mode || "manual";

    const brigades = [...list].sort((a, b) => String(a.brigade).localeCompare(String(b.brigade)));
    const freeVehicles = () => vehicles.filter((vehicle) => !used.has(vehicle.id));

    if (mode === "manual") {
      const ids = Array.isArray(line.manual_vehicles) ? line.manual_vehicles : [];
      brigades.forEach((assignment, index) => {
        const vehicle = vehicles.find((item) => item.id === ids[index]);
        if (!vehicle || used.has(vehicle.id)) return;
        used.add(vehicle.id);
        result.set(vehicle.id, { assignment, line });
      });
      return;
    }

    if (mode === "model") {
      const pool = freeVehicles().filter((vehicle) => matchesModel(vehicle, line.model_filter));
      brigades.forEach((assignment, index) => {
        const vehicle = pool[index];
        if (!vehicle || used.has(vehicle.id)) return;
        used.add(vehicle.id);
        result.set(vehicle.id, { assignment, line });
      });
      return;
    }

    if (mode === "percentage") {
      const mix = (Array.isArray(line.model_mix) ? line.model_mix : [])
        .map((entry) => ({ model: String(entry?.model || "").trim(), percent: Number(entry?.percent) || 0 }))
        .filter((entry) => entry.percent > 0);
      const sum = mix.reduce((total, entry) => total + entry.percent, 0) || 1;
      const counters = mix.map((entry) => ({ ...entry, weight: entry.percent / sum, used: 0 }));

      brigades.forEach((assignment) => {
        let target = null;
        let bestDeficit = -Infinity;
        counters.forEach((counter) => {
          const available = freeVehicles().some((vehicle) => matchesModel(vehicle, counter.model));
          if (!available) return;
          const deficit = counter.weight - counter.used;
          if (deficit > bestDeficit) {
            bestDeficit = deficit;
            target = counter;
          }
        });

        let vehicle = null;
        if (target) {
          vehicle = freeVehicles().find((entry) => matchesModel(entry, target.model)) || null;
        }
        if (!vehicle) vehicle = freeVehicles()[0] || null;
        if (!vehicle) return;

        if (target) target.used += 1;
        used.add(vehicle.id);
        result.set(vehicle.id, { assignment, line });
      });
    }
  });

  return result;
}

export function computeFleetState({ vehicles, lines, assignments, simMinutes, dayKey }) {
  const assigned = resolveAssignments({ vehicles, lines, assignments });

  const items = (vehicles || []).map((vehicle) => {
    const entry = assigned.get(vehicle.id) || null;
    const assignment = entry?.assignment || null;
    const line = entry?.line || null;
    return { vehicle, assignment, line, info: null, elapsed: 0, state: null };
  });

  const byLine = new Map();
  items.forEach((item) => {
    if (!item.assignment || !item.line) return;
    item.info = legInfo({ assignment: item.assignment, line: item.line, simMinutes, dayKey });
    if (!item.info) return;
    if (!byLine.has(item.line.id)) byLine.set(item.line.id, []);
    byLine.get(item.line.id).push(item);
  });

  // Wozy na tej samej linii nie wyprzedzają się — drugi czeka za pierwszym.
  byLine.forEach((list) => {
    list.sort((a, b) => a.info.startSec - b.info.startSec);
    let previous = null;
    list.forEach((item) => {
      let elapsed = item.info.elapsed;
      let held = false;
      if (previous) {
        const limit = previous.elapsed - HOLD_GAP_SEC;
        if (elapsed > limit) {
          elapsed = Math.max(0, limit);
          held = true;
        }
      }
      item.elapsed = elapsed;
      item.state = stateFromElapsed({ ...item.info, elapsed, line: item.line, held });
      previous = item;
    });
  });

  return items.map(({ vehicle, assignment, line, state }) => ({ vehicle, assignment, line, state }));
}

export function lastActivity({ assignment, line, dayKey, simMinutes }) {
  if (!assignment || !line) return null;
  const cycle = buildCycle(line);
  if (!cycle) return null;

  const todayIndex = DAY_KEYS.indexOf(dayKey);
  const nowSec = simMinutes * 60;

  for (let back = 0; back <= 7; back += 1) {
    const key = DAY_KEYS[(((todayIndex - back) % 7) + 7) % 7];
    const departures = departuresFor(assignment, key);
    if (!departures.length) continue;
    const endSec = departures[departures.length - 1] * 60 + cycle.total;
    if (endSec <= (back === 0 ? nowSec : 24 * 3600)) {
      return { minutes: endSec / 60, dayOffset: back };
    }
  }

  return null;
}

export function formatLastActivity(activity, dayKey) {
  if (!activity) return "brak kursów";
  const time = formatClock(activity.minutes);
  if (activity.dayOffset === 0) return `dzisiaj, ${time}`;
  if (activity.dayOffset === 1) return `wczoraj, ${time}`;
  const todayIndex = DAY_KEYS.indexOf(dayKey);
  const key = DAY_KEYS[(((todayIndex - activity.dayOffset) % 7) + 7) % 7];
  return `${DAY_SHORT[key]}, ${time}`;
}

export function nextDepartureAcross(items, dayKey, simMinutes) {
  let best = null;
  let earliest = null;

  (items || []).forEach((item) => {
    if (!item.assignment) return;
    departuresFor(item.assignment, dayKey).forEach((dep) => {
      if (earliest == null || dep < earliest) earliest = dep;
      if (dep > simMinutes && (best == null || dep < best)) best = dep;
    });
  });

  return best ?? earliest;
}

export function getWarsawClock() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const map = {};
  parts.forEach((part) => {
    map[part.type] = part.value;
  });

  const weekday = { Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat", Sun: "sun" }[map.weekday] || "mon";

  return { dayKey: weekday, minutes: Number(map.hour) * 60 + Number(map.minute) };
}
