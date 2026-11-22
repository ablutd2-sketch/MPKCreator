import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getWarsawClock } from "@/lib/simulation";

const SimulationContext = createContext(null);

export function SimulationProvider({ children }) {
  const [mode, setMode] = useState("sim");
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [dayKey, setDayKey] = useState("mon");
  const [simMinutes, setSimMinutes] = useState(8 * 60);
  const [focusVehicleId, setFocusVehicleId] = useState(null);
  const [clockReady, setClockReady] = useState(false);

  useEffect(() => {
    const clock = getWarsawClock();
    setDayKey(clock.dayKey);
    setSimMinutes(clock.minutes);
    setClockReady(true);
  }, []);

  const frame = useRef(0);

  useEffect(() => {
    if (!running || mode !== "sim") return undefined;
    let last = performance.now();
    let accumulated = 0;

    const tick = (now) => {
      const delta = Math.min(0.5, (now - last) / 1000);
      last = now;
      accumulated += delta;
      if (accumulated >= 0.1) {
        const step = (accumulated * speed) / 60;
        accumulated = 0;
        setSimMinutes((value) => (value + step) % 1440);
      }
      frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [running, speed, mode]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      running,
      setRunning,
      speed,
      setSpeed,
      dayKey,
      setDayKey,
      simMinutes,
      setSimMinutes,
      focusVehicleId,
      setFocusVehicleId,
      clockReady,
    }),
    [mode, running, speed, dayKey, simMinutes, focusVehicleId, clockReady]
  );

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) throw new Error("useSimulation musi być użyte wewnątrz SimulationProvider");
  return context;
}
