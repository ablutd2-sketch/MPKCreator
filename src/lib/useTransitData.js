import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const asArray = (value) => (Array.isArray(value) ? value : value?.items || []);

const CACHE_MS = 20000;
// Odświeżenia z wielu widoków naraz nie mogą zasypać API — najwyżej jedno
// zapytanie na kilka sekund, reszta korzysta z ostatnich danych.
const MIN_NETWORK_MS = 5000;
let cache = { data: null, at: 0 };
let lastAttempt = 0;
let inFlight = null;
// Wszystkie zamontowane widoki (mapa, okno podmiany, tabor) słuchają odświeżeń,
// żeby po powrocie autobusu alarm i lista zniknęły od razu, a nie po 20 s.
const listeners = new Set();

async function fetchTransit() {
  lastAttempt = Date.now();
  try {
    const [vehicles, lines, assignments] = await Promise.all([
      base44.entities.Vehicle.list({ sort: "created_date", limit: 200 }),
      base44.entities.Line.list({ sort: "created_date", limit: 200 }),
      base44.entities.Assignment.list({ sort: "created_date", limit: 500 }),
    ]);
    cache = {
      data: { vehicles: asArray(vehicles), lines: asArray(lines), assignments: asArray(assignments) },
      at: Date.now(),
    };
    return cache.data;
  } catch (error) {
    // Limit zapytań albo chwilowy błąd sieci: zostajemy przy ostatnich danych.
    if (cache.data) return cache.data;
    throw error;
  }
}

function getTransit(force = false) {
  if (inFlight) return inFlight;
  const cached = cache.data;
  const fresh = cached && Date.now() - cache.at < CACHE_MS;
  const tooSoon = Date.now() - lastAttempt < MIN_NETWORK_MS;
  if (cached && (fresh || tooSoon) && (!force || tooSoon)) return Promise.resolve(cached);
  inFlight = fetchTransit().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export function useTransitData() {
  const [state, setState] = useState({ vehicles: [], lines: [], assignments: [], loading: true });

  const apply = useCallback((data) => setState({ ...data, loading: false }), []);

  const load = useCallback(
    async (force = false) => {
      const data = await getTransit(force);
      if (force) listeners.forEach((listener) => listener(data));
      apply(data);
    },
    [apply]
  );

  const reload = useCallback(() => load(true), [load]);

  useEffect(() => {
    listeners.add(apply);
    load();
    return () => {
      listeners.delete(apply);
    };
  }, [apply, load]);

  return { ...state, reload };
}

export function useLivePositions(enabled) {
  const [positions, setPositions] = useState([]);

  const load = useCallback(async () => {
    try {
      const result = await base44.entities.LivePosition.list({ sort: "-updated_date", limit: 300 });
      setPositions(asArray(result));
    } catch {
      // Chwilowy limit zapytań — zostawiamy poprzednie pozycje.
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [enabled, load]);

  return positions;
}
