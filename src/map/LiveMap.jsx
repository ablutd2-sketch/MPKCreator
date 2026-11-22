import { Fragment, useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, Tooltip, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { busIcon } from "@/lib/busIcon";
import BaseTileLayer from "@/components/map/BaseTileLayer";
import MapSearch from "@/components/map/MapSearch";
import VehiclePopup from "@/components/map/VehiclePopup";
import { POLAND_CENTER, POLAND_ZOOM } from "@/lib/mapConfig";

function MapFocus({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], 15, { duration: 0.9 });
  }, [target?.lat, target?.lng, map]);
  return null;
}

function VehicleMarker({ item }) {
  const icon = useMemo(
    () =>
      busIcon(item),
    [item.vehicle.image_url, item.vehicle.fleet_number, item.line?.color, item.line?.number, item.line?.night]
  );

  return (
    <Marker position={[item.state.lat, item.state.lng]} icon={icon}>
      <Popup autoPan={false}>
        <VehiclePopup item={item} />
      </Popup>
    </Marker>
  );
}

function LineStops({ line }) {
  const stops = Array.isArray(line.stops) ? line.stops : [];
  const color = line.color || "#14223B";

  return (
    <>
      {stops.map((stop, index) => {
        const backLat = Number(stop.lat_back);
        const backLng = Number(stop.lng_back);
        const hasBack =
          Number.isFinite(backLat) &&
          Number.isFinite(backLng) &&
          (Math.abs(backLat - Number(stop.lat)) > 0.00004 || Math.abs(backLng - Number(stop.lng)) > 0.00004);

        return (
          <Fragment key={`${line.id}-stop-${index}`}>
            <CircleMarker
              center={[stop.lat, stop.lng]}
              radius={6}
              pathOptions={{ color: "#ffffff", weight: 2, fillColor: color, fillOpacity: 1 }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                {`${stop.name || "Przystanek"} ${stop.pole || "01"}`}
              </Tooltip>
            </CircleMarker>
            {hasBack && (
              <CircleMarker
                center={[backLat, backLng]}
                radius={4}
                pathOptions={{ color, weight: 2, fillColor: "#ffffff", fillOpacity: 1 }}
              >
                <Tooltip direction="top" offset={[0, -6]}>
                  {`${stop.name || "Przystanek"} ${stop.pole_back || "02"}`}
                </Tooltip>
              </CircleMarker>
            )}
          </Fragment>
        );
      })}
    </>
  );
}

export default function LiveMap({ items = [], focus }) {
  const routes = useMemo(() => {
    const seen = new Map();
    items.forEach((item) => {
      const line = item.line;
      if (!line?.id || seen.has(line.id)) return;
      if (!Array.isArray(line.stops) || line.stops.length < 2) return;
      seen.set(line.id, line);
    });
    return [...seen.values()];
  }, [items]);

  return (
    <MapContainer center={POLAND_CENTER} zoom={POLAND_ZOOM} zoomControl={false} className="h-full w-full" scrollWheelZoom>
      <BaseTileLayer />
      <MapSearch />

      {routes.map((line) => {
        const color = line.color || "#14223B";
        const hasTam = Array.isArray(line.path_tam) && line.path_tam.length > 1;
        const hasPowrot = Array.isArray(line.path_powrot) && line.path_powrot.length > 1;

        return (
          <Fragment key={line.id}>
            <Polyline
              positions={
                hasTam ? line.path_tam.map((point) => [point.lat, point.lng]) : line.stops.map((stop) => [stop.lat, stop.lng])
              }
              pathOptions={{
                color,
                weight: hasTam ? 5 : 4,
                opacity: hasTam ? 0.6 : 0.4,
                lineCap: "round",
                dashArray: hasTam ? undefined : "6 8",
              }}
            />
            {hasPowrot && (
              <Polyline
                positions={line.path_powrot.map((point) => [point.lat, point.lng])}
                pathOptions={{ color, weight: 3, opacity: 0.32, dashArray: "2 7", lineCap: "round" }}
              />
            )}
            <LineStops line={line} />
          </Fragment>
        );
      })}

      {items.map((item) => (
        <VehicleMarker key={item.vehicle.id} item={item} />
      ))}

      <MapFocus target={focus} />
      <ZoomControl position="bottomright" />
    </MapContainer>
  );
}
