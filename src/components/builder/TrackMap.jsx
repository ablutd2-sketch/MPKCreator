import { useEffect } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Tooltip, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { stopIcon } from "@/lib/busIcon";
import BaseTileLayer from "@/components/map/BaseTileLayer";
import MapSearch from "@/components/map/MapSearch";
import { POLAND_CENTER, POLAND_ZOOM } from "@/lib/mapConfig";
import { TRAM_COLOR, trackPositions } from "@/lib/track";

function ClickAdd({ onAdd }) {
  useMapEvents({
    click(event) {
      onAdd?.(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function Fit({ fitKey, points, stops }) {
  const map = useMap();

  useEffect(() => {
    const all = [...points, ...stops]
      .map((item) => [Number(item.lat), Number(item.lng)])
      .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
    if (!all.length) return;
    if (all.length === 1) map.setView(all[0], 15);
    else map.fitBounds(L.latLngBounds(all), { padding: [40, 40], maxZoom: 16 });
  }, [fitKey]);

  return null;
}

export default function TrackMap({ points = [], stops = [], onAdd, fitKey }) {
  const first = points[0] || stops[0] || null;
  const center = first ? [Number(first.lat), Number(first.lng)] : POLAND_CENTER;
  const zoom = first ? 14 : POLAND_ZOOM;

  return (
    <MapContainer center={center} zoom={zoom} zoomControl={false} className="h-full w-full" scrollWheelZoom>
      <BaseTileLayer />
      <MapSearch />
      <ClickAdd onAdd={onAdd} />
      <Fit fitKey={fitKey} points={points} stops={stops} />

      {points.length > 1 && (
        <Polyline
          positions={trackPositions(points, true)}
          pathOptions={{ color: TRAM_COLOR, weight: 4, opacity: 0.95, dashArray: "12 9", lineCap: "round" }}
        />
      )}

      {points.map((point, index) => (
        <CircleMarker
          key={`track-${index}-${point.lat}-${point.lng}`}
          center={[Number(point.lat), Number(point.lng)]}
          radius={5}
          pathOptions={{ color: "#14223B", weight: 2, fillColor: "#ffffff", fillOpacity: 1 }}
        >
          <Tooltip direction="top" offset={[0, -6]}>{`Punkt ${index + 1}`}</Tooltip>
        </CircleMarker>
      ))}

      {stops.map((stop, index) => {
        const variant = index === 0 ? "start" : index === stops.length - 1 ? "end" : "mid";
        return (
          <Marker
            key={`stop-${index}-${stop.lat}-${stop.lng}`}
            position={[Number(stop.lat), Number(stop.lng)]}
            icon={stopIcon(String(index + 1), variant)}
          >
            <Tooltip direction="top" offset={[0, -12]}>{`${stop.name || "Przystanek"} ${stop.pole || "01"}`}</Tooltip>
          </Marker>
        );
      })}

      <ZoomControl position="bottomright" />
    </MapContainer>
  );
}
