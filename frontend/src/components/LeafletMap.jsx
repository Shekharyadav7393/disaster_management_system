import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DEFAULT_CENTER = [22.9734, 78.6569];

const pinIcon = new L.Icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const getMarkerColor = (marker) => {
  if (marker.type === "team") return "#22c55e";
  if (marker.type === "zone") return "#f97316";
  if (marker.type === "camp") return "#3b82f6";
  if (marker.type === "report") return "#06b6d4";

  switch (marker.severity) {
    case "critical":
      return "#ef4444";
    case "high":
      return "#f97316";
    case "medium":
      return "#f59e0b";
    default:
      return "#3b82f6";
  }
};

const toLatLng = (value) => {
  if (!value) return null;
  if (Array.isArray(value) && value.length === 2) return value;
  if (typeof value.lat === "number" && typeof value.lng === "number") {
    return [value.lat, value.lng];
  }
  return null;
};

const ClickHandler = ({ onClick }) => {
  useMapEvents({
    click(event) {
      onClick?.({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });
  return null;
};

const ViewportController = ({ center, markers, selectedPosition, userLocation, zoom = 5 }) => {
  const map = useMap();

  useEffect(() => {
    const positions = [
      toLatLng(center),
      toLatLng(selectedPosition),
      toLatLng(userLocation),
      ...(markers || []).map((item) => toLatLng(item)).filter(Boolean),
    ].filter(Boolean);

    if (positions.length > 1) {
      map.fitBounds(positions, { padding: [30, 30] });
      return;
    }

    const target = positions[0] || DEFAULT_CENTER;
    map.setView(target, zoom);
  }, [center, map, markers, selectedPosition, userLocation, zoom]);

  return null;
};

const MapResizer = () => {
  const map = useMap();

  useEffect(() => {
    const resizeMap = () => map.invalidateSize();
    const timeoutId = window.setTimeout(resizeMap, 50);

    window.addEventListener("resize", resizeMap);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", resizeMap);
    };
  }, [map]);

  return null;
};

const LeafletMap = ({
  center = DEFAULT_CENTER,
  zoom = 5,
  height = 320,
  onClick,
  onMarkerClick,
  markers = [],
  selectedPosition,
  userLocation,
  className = "",
}) => {
  const initialCenter = toLatLng(center) || toLatLng(selectedPosition) || toLatLng(userLocation) || DEFAULT_CENTER;

  return (
    <div
      className={className}
      style={{
        height,
        width: "100%",
        maxWidth: "100%",
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "var(--panel-2)",
      }}
    >
      <MapContainer center={initialCenter} zoom={zoom} style={{ height: "100%", width: "100%", maxWidth: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ViewportController
          center={center}
          markers={markers}
          selectedPosition={selectedPosition}
          userLocation={userLocation}
          zoom={zoom}
        />
        <MapResizer />
        <ClickHandler onClick={onClick} />

        {markers
          .filter((marker) => typeof marker?.lat === "number" && typeof marker?.lng === "number")
          .map((marker) => (
            <CircleMarker
              key={marker.id || marker._id || `${marker.type}-${marker.title}-${marker.lat}-${marker.lng}`}
              center={[marker.lat, marker.lng]}
              pathOptions={{
                color: getMarkerColor(marker),
                fillColor: getMarkerColor(marker),
                fillOpacity: 0.65,
                weight: 2,
              }}
              radius={8}
              eventHandlers={{
                click: () => onMarkerClick?.(marker),
              }}
            >
              <Popup>
                <div style={{ minWidth: 140 }}>
                  <strong>{marker.title || "Map item"}</strong>
                  {marker.severity && (
                    <div style={{ marginTop: 6, textTransform: "capitalize" }}>Severity: {marker.severity}</div>
                  )}
                  {marker.type && <div style={{ marginTop: 4, textTransform: "capitalize" }}>Type: {marker.type}</div>}
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {toLatLng(selectedPosition) && (
          <Marker position={toLatLng(selectedPosition)} icon={pinIcon}>
            <Popup>Selected location</Popup>
          </Marker>
        )}

        {toLatLng(userLocation) && (
          <CircleMarker
            center={toLatLng(userLocation)}
            pathOptions={{ color: "#2563eb", fillColor: "#60a5fa", fillOpacity: 0.9, weight: 3 }}
            radius={10}
          >
            <Popup>Your location</Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
