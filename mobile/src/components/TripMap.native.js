import React from 'react';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Platform, StyleSheet } from 'react-native';

export default function TripMap({ driverLocation, pickup, dropoff, showPolyline, style }) {
  const initialRegion = {
    ...(driverLocation || pickup),
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <MapView
      style={[styles.map, style]}
      initialRegion={initialRegion}
      region={driverLocation ? { ...driverLocation, latitudeDelta: 0.04, longitudeDelta: 0.04 } : undefined}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
    >
      {pickup && <Marker coordinate={pickup} title="Pick-Up" pinColor="blue" />}
      {dropoff && <Marker coordinate={dropoff} title="Drop-Off" pinColor="red" />}
      {driverLocation && <Marker coordinate={driverLocation} title="Driver" pinColor="green" />}
      {showPolyline && driverLocation && pickup && (
        <Polyline coordinates={[driverLocation, pickup]} strokeColor="#1a73e8" strokeWidth={3} lineDashPattern={[6, 4]} />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({ map: { flex: 1 } });
