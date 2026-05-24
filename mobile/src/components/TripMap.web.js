import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, map.getZoom()); }, [center]);
  return null;
}

export default function TripMap({ driverLocation, pickup, dropoff, showPolyline, style }) {
  const center = driverLocation || pickup || { latitude: 0, longitude: 0 };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 300, ...style }}>
      <MapContainer
        center={[center.latitude, center.longitude]}
        zoom={13}
        style={{ width: '100%', height: '100%', minHeight: 300 }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
        {driverLocation && <RecenterMap center={[driverLocation.latitude, driverLocation.longitude]} />}
        {pickup && (
          <Marker position={[pickup.latitude, pickup.longitude]} icon={blueIcon}>
            <Popup>Pick-Up</Popup>
          </Marker>
        )}
        {dropoff && (
          <Marker position={[dropoff.latitude, dropoff.longitude]} icon={redIcon}>
            <Popup>Drop-Off</Popup>
          </Marker>
        )}
        {driverLocation && (
          <Marker position={[driverLocation.latitude, driverLocation.longitude]} icon={greenIcon}>
            <Popup>Driver</Popup>
          </Marker>
        )}
        {showPolyline && driverLocation && pickup && (
          <Polyline
            positions={[[driverLocation.latitude, driverLocation.longitude], [pickup.latitude, pickup.longitude]]}
            color="#1a73e8" dashArray="6 4"
          />
        )}
      </MapContainer>
    </div>
  );
}
