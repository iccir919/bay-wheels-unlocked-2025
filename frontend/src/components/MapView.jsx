import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Tooltip,
  useMap,
  useMapEvents
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Clears highlight when clicking on map background
function MapClickHandler({ onClear }) {
  useMapEvents({
    click: (e) => {
      if (e.originalEvent.target.tagName === "DIV") {
        onClear();
      }
    },
  });
  return null;
}

export default function MapView({ mapView, stations, routes, highlight, onSelect, onClear }) {
  const sfCenter = [37.7749, -122.4194];
  const [hovered, setHovered] = useState({ type: null, id: null });

  const stationMin = Math.min(...stations.map(s => s.total_trips));
  const stationMax = Math.max(...stations.map(s => s.total_trips));
  const routeMin = Math.min(...routes.map(r => r.total_trips));
  const routeMax = Math.max(...routes.map(r => r.total_trips));

  const stationStyle = (trips, isActive, isDimmed, isHovered) => {
    const t = Math.min(1, Math.max(0, (trips - stationMin) / (stationMax - stationMin)));

    let fillOpacity = 0.55 + 0.35 * t;
    let radius = 6;

    if (isHovered) radius = 9;
    if (isActive) radius = 12;
    if (isDimmed) fillOpacity = 0.25;

    return {
      color: "#2563eb",     // blue-600 stroke
      fillColor: "#3b82f6", // blue-500 fill
      fillOpacity,
      weight: isActive ? 2.5 : 1.5,
      radius
    };
  };



  const routeStyle = (trips, isActive, isDimmed, isHovered) => {
    const t = Math.min(1, Math.max(0, (trips - routeMin) / (routeMax - routeMin)));

    // Base soft blue
    let color = "#60a5fa"; // blue-400
    let opacity = 0.3 + 0.7 * t;  // keep opacity scaling
    let weight = 2 + 3 * t;        // slightly thicker base

    if (isHovered) {
      color = "#3b82f6"; // blue-500
      opacity = 0.9;
      weight = 5 + 1 * t;
    }

    if (isActive) {
      color = "#1d4ed8"; // blue-700
      opacity = 0.95;
      weight = 6 + 1 * t;
    }

    if (isDimmed) {
      color = "#93c5fd"; // blue-300
      opacity = 0.1;
      weight = 1.5;
    }

    return { color, weight, opacity };
  };












  return (
    <MapContainer center={sfCenter} zoom={13} style={{ height: "500px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler onClear={onClear} />

      <MapAutoFly
        highlight={highlight}
        stations={stations}
        routes={routes}
      />

      {/* Routes */}
      {mapView !== "stations" &&
        routes.map(route => {
          const routeId = `${route.s1_id}-${route.s2_id}`;
          const isActive = highlight.type === 'route' && highlight.id === routeId;
          const isHovered = hovered.type === 'route' && hovered.id === routeId;
          const isDimmed = highlight.type && !isActive;

          return (
            <Polyline
              key={routeId}
              positions={[[route.s1_lat, route.s1_lng], [route.s2_lat, route.s2_lng]]}
              pathOptions={routeStyle(route.total_trips, isActive, isDimmed, isHovered)}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  onSelect('route', routeId);
                },
                mouseover: () => setHovered({ type: 'route', id: routeId }),
                mouseout: () => setHovered({ type: null, id: null }),
              }}
            >
              {isActive && (
                <Tooltip direction="top" offset={[0, -5]} opacity={0.95} permanent>
                  <div style={{ minWidth: "180px" }}>
                    <strong>🚲 Route</strong>
                    <p>
                      <strong>Stations:</strong><br />
                      {route.s1_name} ↔ {route.s2_name}
                    </p>
                    <p>
                      <strong>Total Trips:</strong> {route.total_trips.toLocaleString()}<br />
                      <strong>Subscribers:</strong> {route.member_trips.toLocaleString()}<br />
                      <strong>Casual:</strong> {route.casual_trips.toLocaleString()}<br />
                      <strong>Avg Duration:</strong> {route.avg_duration_minutes.toFixed(1)} min
                    </p>
                  </div>
                </Tooltip>
              )}
            </Polyline>
          );
        })
      }

      {/* Stations */}
      {mapView !== "routes" &&
        stations.map(station => {
          const stationId = station.station_id;
          const isActive = highlight.type === 'station' && highlight.id === stationId;
          const isHovered = hovered.type === 'station' && hovered.id === stationId;
          const isDimmed = highlight.type && !isActive;

          return (
            <CircleMarker
              key={stationId}
              center={[station.latitude, station.longitude]}
              pathOptions={stationStyle(station.total_trips, isActive, isDimmed, isHovered)}
              eventHandlers={{
                click: (e) => {
                  onSelect('station', stationId);
                },
                mouseover: () => setHovered({ type: 'station', id: stationId }),
                mouseout: () => setHovered({ type: null, id: null }),
              }}
            >
              {isActive && (
                <Tooltip direction="top" offset={[0, -5]} opacity={0.95} permanent>
                  <div style={{ minWidth: "160px" }}>
                    <strong>📍 Station</strong>
                    <p>
                      <strong>Name:</strong> {station.name}
                    </p>
                    <p>
                      <strong>Total Trips:</strong> {station.total_trips.toLocaleString()}<br />
                      <strong>Subscribers:</strong> {station.member_trips.toLocaleString()}<br />
                      <strong>Casual:</strong> {station.casual_trips.toLocaleString()}<br />
                      <strong>Round Trips:</strong> {station.round_trips.toLocaleString()}
                    </p>
                  </div>
                </Tooltip>
              )}
            </CircleMarker>
          );
        })
      }
    </MapContainer>
  );
}

function MapAutoFly({ highlight, stations, routes }) {
  const map = useMap();

  useEffect(() => {
    if (!highlight.type || !highlight.id) return;

    // ─── Station ───────────────────────────────
    if (highlight.type === "station") {
      const station = stations.find(
        s => s.station_id === highlight.id
      );

      if (!station) return;

      map.flyTo(
        [station.latitude, station.longitude],
        Math.max(map.getZoom(), 15),
        { duration: 0.6 }
      );
    }

    // ─── Route ─────────────────────────────────
    if (highlight.type === "route") {
      const route = routes.find(
        r => `${r.s1_id}-${r.s2_id}` === highlight.id
      );

      if (!route) return;

      map.fitBounds(
        [
          [route.s1_lat, route.s1_lng],
          [route.s2_lat, route.s2_lng],
        ],
        {
          padding: [80, 80],
          duration: 0.6,
        }
      );
    }
  }, [highlight, map, stations, routes]);

  return null;
}