import { 
  MapContainer, 
  TileLayer, 
  CircleMarker, 
  Polyline
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapView({ mapView, stations, routes }) {
  const sfCenter = [37.7749, -122.4194];

  const stationColor = (trips) => {
    const min = 1, max = 85145;
    const t = Math.min(1, Math.max(0, (trips - min) / (max - min)));
    return `rgba(236, 72, 153, ${0.3 + 0.7 * t})`;
  };

  const routeColor = (trips) => {
    const min = 445, max = 3084;
    const t = Math.min(1, Math.max(0, (trips - min) / (max - min)));
    return `rgba(59, 130, 246, ${0.3 + 0.7 * t})`;
  };

  return (
    <MapContainer center={sfCenter} zoom={13} style={{ height: "500px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {mapView !== "routes" &&
        stations.map((station) => {
          console.log(station)
          return (
            <CircleMarker
              key={station.station_id}
              center={[station.latitude, station.longitude]}
              radius={6}
              pathOptions={{
                color: stationColor(station.total_trips),
                fillColor: stationColor(station.total_trips),
                fillOpacity: 0.7
              }}
            />
          )
        })}
    </MapContainer>
  )


}