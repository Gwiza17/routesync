import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { io } from 'socket.io-client';
import TripMap from '../../components/TripMap';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';

export default function TripTrackingScreen({ route }) {
  const { booking } = route.params;
  const [driverLocation, setDriverLocation] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(API_URL);
    socketRef.current.emit('join:booking', { bookingId: booking.id });
    socketRef.current.on('driver:location', ({ latitude, longitude }) => {
      setDriverLocation({ latitude, longitude });
    });
    return () => socketRef.current?.disconnect();
  }, [booking.id]);

  const pickup = { latitude: booking.pickupLatitude, longitude: booking.pickupLongitude };
  const dropoff = { latitude: booking.dropoffLatitude, longitude: booking.dropoffLongitude };

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <TripMap driverLocation={driverLocation} pickup={pickup} dropoff={dropoff} showPolyline />
      </View>
      <View style={styles.info}>
        <Text style={styles.infoTitle}>Trip In Progress</Text>
        <Text style={styles.infoSub}>
          {driverLocation ? 'Driver is on the way' : 'Waiting for driver location...'}
        </Text>
        <Text style={styles.addr}>{booking.pickupAddress} → {booking.dropoffAddress}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  info: { padding: 20, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  infoTitle: { fontSize: 20, fontWeight: '800', color: '#222' },
  infoSub: { color: '#34a853', fontWeight: '600', marginTop: 4 },
  addr: { color: '#666', marginTop: 8, fontSize: 13 },
});
