import { Fragment, useEffect, useRef } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Tooltip, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { stopIcon } from "@/lib/busIcon";
import BaseTileLayer from "@/components/map/BaseTileLayer";
import MapSearch from "@/components/map/MapSearch";
import { POLAND_CENTER, POLAND_ZOOM } from "@/lib/mapConfig";

function ClickHandler({ onAdd, onPlaceBack, placingBack, onPlaceVia, placingVia }) {
  useMapEvents({
    click(event) {
      if (placingVia) onPlaceVia?.(event.latlng.lat, event.latlng.lng);
      else if (placingBack != null) onPlaceBack?.(event.latlng.lat, event.latlng.lng);
      else onAdd?.(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function hasBackPole(stop) {
  const lat = Number(stop?.lat_back);
  const lng = Number(stop?.lng_back);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    (Math.abs(lat - Number(stop.lat)) > 0.00004 || Math.abs(lng - Number(stop.lng)) > 0.00004)
  );
}

function MapViewport({ fitKey, stops }) {
  const map = useMap();
  const previousCount = useRef(stops.length);

  useEffect(() => {
    if (!stops.length) return;
    const points = [];
    stops.forEach((stop) => {
      points.push([Number(stop.lat), Number(stop.lng)]);
      if (hasBackPole(stop)) points.push([Number(stop.lat_back), Number(stop.lng_back)]);
    });
    if (points.length === 1) map.setView(points[0], 15);
    else map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16 });
  }, [fitKey]);

  useEffect(() => {
    if (stops.length === 1 && previousCount.current === 0) {
      map.setView([Number(stops[0].lat), Number(stops[0].lng)], 15);
    }
    previousCount.current = stops.length;
  }, [stops.length]);

  return null;
}

export default function StopsMap({
  stops = [],
  color = "#C8102E",
  pathTam = [],
  pathPowrot = [],
  onAdd,
  onPlaceBack,
  placingBack = null,
  via = [],
  onPlaceVia,
  placingVia = false,
  fitKey,
}) {
  const center = stops.length ? [Number(stops[0].lat), Number(stops[0].lng)] : POLAND_CENTER;
  const zoom = stops.length ? 14 : POLAND_ZOOM;
  const hasTam = Array.isArray(pathTam) && pathTam.length > 1;
  const hasPowrot = Array.isArray(pathPowrot) && pathPowrot.length > 1;

  return (
    <MapContainer center={center} zoom={zoom} zoomControl={false} className="h-full w-full" scrollWheelZoom>
      <BaseTileLayer />
      <MapSearch />
      <ClickHandler
        onAdd={onAdd}
        onPlaceBack={onPlaceBack}
        placingBack={placingBack}
        onPlaceVia={onPlaceVia}
        placingVia={placingVia}
      />
      <MapViewport fitKey={fitKey} stops={stops} />

      {via.map((point, index) => (
        <CircleMarker
          key={`via-${index}-${point.lat}-${point.lng}`}
          center={[Number(point.lat), Number(point.lng)]}
          radius={6}
          pathOptions={{ color: "#B26A00", fillColor: "#B26A00", fillOpacity: 1, weight: 2 }}
        />
      ))}

      <Polyline
        positions={hasTam ? pathTam.map((point) => [point.lat, point.lng]) : stops.map((stop) => [Number(stop.lat), Number(stop.lng)])}
        pathOptions={{
          color,
          weight: hasTam ? 5 : 4,
          opacity: hasTam ? 0.75 : 0.45,
          lineCap: "round",
          dashArray: hasTam ? undefined : "6 8",
        }}
      />
      {hasPowrot && (
        <Polyline
          positions={pathPowrot.map((point) => [point.lat, point.lng])}
          pathOptions={{ color, weight: 3, opacity: 0.4, dashArray: "3 7", lineCap: "round" }}
        />
      )}

      {stops.map((stop, index) => {
        const variant = index === 0 ? "start" : index === stops.length - 1 ? "end" : "mid";
        return (
          <Fragment key={`${stop.lat}-${stop.lng}-${index}`}>
            <Marker position={[Number(stop.lat), Number(stop.lng)]} icon={stopIcon(String(index + 1), variant)}>
              <Tooltip direction="top" offset={[0, -12]}>
                {`${stop.name || "Przystanek"} ${stop.pole || "01"}`}
              </Tooltip>
            </Marker>
            {hasBackPole(stop) && (
              <Marker position={[Number(stop.lat_back), Number(stop.lng_back)]} icon={stopIcon(stop.pole_back || "02", "ghost")}>
                <Tooltip direction="top" offset={[0, -12]}>
                  {`${stop.name || "Przystanek"} ${stop.pole_back || "02"}`}
                </Tooltip>
              </Marker>
            )}
          </Fragment>
        );
      })}

      <ZoomControl position="bottomright" />
    </MapContainer>
  );
}
