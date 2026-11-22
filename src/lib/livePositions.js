import { parseTime } from "@/lib/simulation";

export function buildLiveItems(positions, vehicles, lines) {
  const vehicleByFleet = new Map(
    (vehicles || []).map((vehicle) => [String(vehicle.fleet_number || "").toLowerCase(), vehicle])
  );
  const lineByNumber = new Map((lines || []).map((line) => [String(line.number || "").toLowerCase(), line]));

  return (positions || [])
    .map((position) => {
      const vehicle = vehicleByFleet.get(String(position.fleet_number || "").toLowerCase());
      const lat = Number(position.lat);
      const lng = Number(position.lng);
      if (!vehicle || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      const line = lineByNumber.get(String(position.line || "").toLowerCase()) || null;
      if (!line) return null;

      return {
        vehicle,
        line,
        assignment: null,
        state: {
          lat,
          lng,
          phase: "live",
          directionLabel: "NA ŻYWO",
          destination: position.direction || "—",
          nextStop: position.next_stop || "—",
          nextDeparture: parseTime(position.next_departure),
          lineColor: line?.color || "#14223B",
        },
      };
    })
    .filter(Boolean);
}
