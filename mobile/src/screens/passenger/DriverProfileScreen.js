import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import api from '../../services/api';

export default function DriverProfileScreen({ route, navigation }) {
  const { driver } = route.params;
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    api.get(`/drivers/${driver.driverCode}/schedule`)
      .then(r => setSlots(r.data.filter(s => !s.isBooked)))
      .catch(() => Alert.alert('Error', 'Could not load schedule'));
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backTxt}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.name}>{driver.user?.name}</Text>
      <Text style={styles.code}>{driver.driverCode}</Text>
      <Text style={styles.detail}>{driver.vehicle} · {driver.licensePlate}</Text>
      <Text style={styles.rate}>${driver.ratePerMile} / mile</Text>

      <Text style={styles.sectionTitle}>Available Slots</Text>

      {slots.length === 0
        ? <Text style={styles.empty}>No available slots</Text>
        : <FlatList
            data={slots}
            keyExtractor={i => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.slot}
                onPress={() => navigation.navigate('Booking', { slot: item, driver })}
              >
                <Text style={styles.slotDate}>{item.date}</Text>
                <Text style={styles.slotTime}>{item.startTime} – {item.endTime}</Text>
              </TouchableOpacity>
            )}
          />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  back: { marginBottom: 16, marginTop: 40 },
  backTxt: { color: '#1a73e8', fontSize: 16 },
  name: { fontSize: 26, fontWeight: '800', color: '#222' },
  code: { color: '#1a73e8', fontSize: 14, marginBottom: 4 },
  detail: { color: '#555', marginBottom: 4 },
  rate: { fontSize: 20, fontWeight: '700', color: '#34a853', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#222' },
  empty: { color: '#999', textAlign: 'center', marginTop: 40 },
  slot: { padding: 16, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, marginBottom: 10 },
  slotDate: { fontWeight: '700', fontSize: 15 },
  slotTime: { color: '#555', marginTop: 2 },
});
