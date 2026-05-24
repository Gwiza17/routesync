import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import api from '../../services/api';

export default function BookingScreen({ route, navigation }) {
  const { slot, driver } = route.params;
  const [pickup, setPickup] = useState({ address: '', lat: '', lng: '' });
  const [dropoff, setDropoff] = useState({ address: '', lat: '', lng: '' });
  const [loading, setLoading] = useState(false);

  const getEstimate = async () => {
    if (!pickup.address || !dropoff.address) return Alert.alert('Error', 'Enter pick-up and drop-off addresses');
    setLoading(true);
    try {
      const { data } = await api.post('/bookings/estimate', {
        driverCode: driver.driverCode,
        pickupLat: pickup.lat, pickupLng: pickup.lng,
        dropoffLat: dropoff.lat, dropoffLng: dropoff.lng,
      });
      navigation.navigate('CostEstimate', { estimate: data, slot, driver, pickup, dropoff });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not estimate cost');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backTxt}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Book a Trip</Text>
      <Text style={styles.sub}>{slot.date} · {slot.startTime} – {slot.endTime}</Text>
      <Text style={styles.sub}>Driver: {driver.user?.name} · {driver.driverCode}</Text>

      <Text style={styles.label}>Pick-Up Location</Text>
      <TextInput style={styles.input} placeholder="Address" value={pickup.address} onChangeText={v => setPickup(p => ({ ...p, address: v }))} />
      <View style={styles.row}>
        <TextInput style={[styles.input, styles.half]} placeholder="Latitude" value={pickup.lat} onChangeText={v => setPickup(p => ({ ...p, lat: v }))} keyboardType="decimal-pad" />
        <TextInput style={[styles.input, styles.half]} placeholder="Longitude" value={pickup.lng} onChangeText={v => setPickup(p => ({ ...p, lng: v }))} keyboardType="decimal-pad" />
      </View>

      <Text style={styles.label}>Drop-Off Location</Text>
      <TextInput style={styles.input} placeholder="Address" value={dropoff.address} onChangeText={v => setDropoff(p => ({ ...p, address: v }))} />
      <View style={styles.row}>
        <TextInput style={[styles.input, styles.half]} placeholder="Latitude" value={dropoff.lat} onChangeText={v => setDropoff(p => ({ ...p, lat: v }))} keyboardType="decimal-pad" />
        <TextInput style={[styles.input, styles.half]} placeholder="Longitude" value={dropoff.lng} onChangeText={v => setDropoff(p => ({ ...p, lng: v }))} keyboardType="decimal-pad" />
      </View>

      <TouchableOpacity style={styles.btn} onPress={getEstimate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Get Cost Estimate →</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  back: { marginTop: 40, marginBottom: 16 },
  backTxt: { color: '#1a73e8', fontSize: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#222', marginBottom: 4 },
  sub: { color: '#555', marginBottom: 4 },
  label: { fontWeight: '700', marginTop: 20, marginBottom: 8, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 10, fontSize: 15 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  btn: { backgroundColor: '#1a73e8', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
