import { createFileRoute } from "@tanstack/react-router";
import { secrets } from "base44:runtime";

export const Route = createFileRoute("/api/gps")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const token = secrets.get("GPS_WEBHOOK_TOKEN");
        if (!token) {
          return Response.json(
            { error: "Webhook nieaktywny. Dodaj sekret GPS_WEBHOOK_TOKEN w ustawieniach aplikacji." },
            { status: 503 }
          );
        }

        if ((request.headers.get("x-api-key") || "") !== token) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json().catch(() => null);
        if (!body || typeof body !== "object") {
          return Response.json({ error: "Nieprawidłowy JSON" }, { status: 400 });
        }

        const fleetNumber = String(body.fleet_number || "").trim().slice(0, 40);
        const lat = Number(body.lat);
        const lng = Number(body.lng);

        if (!fleetNumber || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
          return Response.json({ error: "Wymagane pola: fleet_number, lat, lng" }, { status: 400 });
        }

        const payload = {
          fleet_number: fleetNumber,
          lat,
          lng,
          line: String(body.line || "").slice(0, 20),
          direction: String(body.direction || "").slice(0, 120),
          next_stop: String(body.next_stop || "").slice(0, 120),
          next_departure: String(body.next_departure || "").slice(0, 5),
          heading: Number.isFinite(Number(body.heading)) ? Number(body.heading) : 0,
          source: "webhook",
        };

        const service = context.getBase44().asServiceRole;
        const existing = await service.entities.LivePosition.filter({ fleet_number: fleetNumber }, { limit: 1 });
        const record = Array.isArray(existing) ? existing[0] : existing?.items?.[0];

        if (record) {
          await service.entities.LivePosition.update(record.id, payload);
        } else {
          await service.entities.LivePosition.create(payload);
        }

        return Response.json({ ok: true, fleet_number: fleetNumber });
      },
    },
  },
});
