import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';
import TripMap from '../../components/TripMap';
import api from '../../services/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';

export default function ActiveTripScreen({ route, navigation }) {
  const { booking } = route.params;
  const [driverLocation, setDriverLocation] = useState(null);
  const [phase, setPhase] = useState('to_pickup');
  const socketRef = useRef(null);
  const watchRef = useRef(null);

  const pickup = { latitude: booking.pickupLatitude, longitude: booking.pickupLongitude };
  const dropoff = { latitude: booking.dropoffLatitude, longitude: booking.dropoffLongitude };

  useEffect(() => {
    socketRef.current = io(API_URL);

    const startTracking = async () => {
      if (Platform.OS === 'web') {
        // Use browser geolocation on web
        if (!navigator.geolocation) return;
        watchRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setDriverLocation({ latitude, longitude });
            socketRef.current?.emit('driver:location', { bookingId: booking.id, latitude, longitude });
          },
          null,
          { enableHighAccuracy: true, maximumAge: 3000 }
        );
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Permission denied', 'Location access is required');
        watchRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 10 },
          (loc) => {
            const { latitude, longitude } = loc.coords;
            setDriverLocation({ latitude, longitude });
            socketRef.current?.emit('driver:location', { bookingId: booking.id, latitude, longitude });
          }
        );
      }
    };

    startTracking();

    return () => {
      if (Platform.OS === 'web') {
        if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
      } else {
        watchRef.current?.remove();
      }
      socketRef.current?.disconnect();
    };
  }, []);

  const completeTrip = async () => {
    try {
      await api.patch(`/bookings/${booking.id}/status`, { status: 'completed' });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not complete trip');
    }
  };

  const target = phase === 'to_pickup' ? pickup : dropoff;

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <TripMap driverLocation={driverLocation} pickup={pickup} dropoff={dropoff} showPolyline />
      </View>
      <View style={styles.panel}>
        <Text style={styles.phase}>
          {phase === 'to_pickup' ? 'Heading to Pick-Up' : 'Heading to Drop-Off'}
        </Text>
        <Text style={styles.addr}>{phase === 'to_pickup' ? booking.pickupAddress : booking.dropoffAddress}</Text>

        {phase === 'to_pickup' && (
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#1a73e8' }]} onPress={() => setPhase('to_dropoff')}>
            <Text style={styles.btnTxt}>Passenger Picked Up →</Text>
          </TouchableOpacity>
        )}
        {phase === 'to_dropoff' && (
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#34a853' }]} onPress={completeTrip}>
            <Text style={styles.btnTxt}>Complete Trip ✓</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  panel: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  phase: { fontSize: 20, fontWeight: '800', color: '#222', marginBottom: 4 },
  addr: { color: '#666', marginBottom: 16 },
  btn: { borderRadius: 10, padding: 16, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
