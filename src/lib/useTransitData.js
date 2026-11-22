import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const asArray = (value) => (Array.isArray(value) ? value : value?.items || []);

const CACHE_MS = 20000;
let cache = { data: null, at: 0 };
let inFlight = null;

async function fetchTransit() {
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
}

function getTransit(force = false) {
  if (!force && cache.data && Date.now() - cache.at < CACHE_MS) return Promise.resolve(cache.data);
  if (inFlight) return inFlight;
  inFlight = fetchTransit().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export function useTransitData() {
  const [state, setState] = useState({ vehicles: [], lines: [], assignments: [], loading: true });

  const load = useCallback(async (force = false) => {
    const data = await getTransit(force);
    setState({ ...data, loading: false });
  }, []);

  const reload = useCallback(() => load(true), [load]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload };
}

export function useLivePositions(enabled) {
  const [positions, setPositions] = useState([]);

  const load = useCallback(async () => {
    const result = await base44.entities.LivePosition.list({ sort: "-updated_date", limit: 300 });
    setPositions(asArray(result));
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [enabled, load]);

  return positions;
}
