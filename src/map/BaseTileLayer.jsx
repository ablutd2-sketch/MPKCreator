import { TileLayer } from "react-leaflet";
import { TILE_ATTRIBUTION, TILE_SUBDOMAINS, TILE_URL } from "@/lib/mapConfig";

export default function BaseTileLayer() {
  return (
    <TileLayer
      url={TILE_URL}
      attribution={TILE_ATTRIBUTION}
      subdomains={TILE_SUBDOMAINS}
      maxZoom={19}
    />
  );
}
