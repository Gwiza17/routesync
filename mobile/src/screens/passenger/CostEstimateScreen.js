import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import api from '../../services/api';

export default function CostEstimateScreen({ route, navigation }) {
  const { estimate, slot, driver, pickup, dropoff } = route.params;
  const [loading, setLoading] = useState(false);

  const confirmBooking = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/bookings', {
        scheduleId: slot.id,
        pickupAddress: pickup.address,
        pickupLatitude: pickup.lat,
        pickupLongitude: pickup.lng,
        dropoffAddress: dropoff.address,
        dropoffLatitude: dropoff.lat,
        dropoffLongitude: dropoff.lng,
      });
      Alert.alert('Booking Confirmed!', `Your trip is booked.\nEstimated cost: $${data.estimatedCost}`, [
        { text: 'View My Trips', onPress: () => navigation.navigate('My Trips') },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backTxt}>← Edit Locations</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Trip Summary</Text>

      <View style={styles.card}>
        <Row label="Driver" value={`${driver.user?.name} (${driver.driverCode})`} />
        <Row label="Date" value={`${slot.date} · ${slot.startTime}`} />
        <Row label="Pick-Up" value={pickup.address} />
        <Row label="Drop-Off" value={dropoff.address} />
      </View>

      <View style={styles.card}>
        <Row label="Rate per mile" value={`$${estimate.ratePerMile}`} />
        <Row label="Driver → Pick-up" value={`${estimate.leg1Miles} mi`} />
        <Row label="Pick-up → Drop-off" value={`${estimate.leg2Miles} mi`} />
        <Row label="Total distance" value={`${estimate.totalMiles} mi`} bold />
      </View>

      <View style={styles.costBox}>
        <Text style={styles.costLabel}>Estimated Total</Text>
        <Text style={styles.cost}>${estimate.estimatedCost}</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={confirmBooking} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirm & Book</Text>}
      </TouchableOpacity>
    </View>
  );
}

const Row = ({ label, value, bold }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
    <Text style={{ color: '#666', flex: 1 }}>{label}</Text>
    <Text style={{ fontWeight: bold ? '800' : '500', color: '#222', flex: 1, textAlign: 'right' }}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  back: { marginTop: 40, marginBottom: 16 },
  backTxt: { color: '#1a73e8', fontSize: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#222', marginBottom: 20 },
  card: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, marginBottom: 16 },
  costBox: { backgroundColor: '#e8f0fe', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 24 },
  costLabel: { color: '#1a73e8', fontWeight: '600', marginBottom: 4 },
  cost: { fontSize: 40, fontWeight: '900', color: '#1a73e8' },
  btn: { backgroundColor: '#34a853', borderRadius: 10, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
