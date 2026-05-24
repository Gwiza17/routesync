import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import api from '../../services/api';

const STATUS_COLORS = { pending: '#f4b400', confirmed: '#1a73e8', in_progress: '#34a853', completed: '#666', cancelled: '#ea4335' };

export default function DriverBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await api.get('/bookings/my');
      setBookings(data);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const accept = async (id) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status: 'confirmed' });
      setBookings(b => b.map(bk => bk.id === id ? { ...bk, status: 'confirmed' } : bk));
    } catch {
      Alert.alert('Error', 'Could not confirm booking');
    }
  };

  const startTrip = async (booking) => {
    try {
      await api.patch(`/bookings/${booking.id}/status`, { status: 'in_progress' });
      navigation.navigate('ActiveTrip', { booking: { ...booking, status: 'in_progress' } });
    } catch {
      Alert.alert('Error', 'Could not start trip');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.empty}>No bookings yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.passenger}>{item.passenger?.name}</Text>
              <Text style={[styles.status, { color: STATUS_COLORS[item.status] }]}>{item.status.replace('_', ' ')}</Text>
            </View>
            <Text style={styles.date}>{item.schedule?.date} · {item.schedule?.startTime}</Text>
            <Text style={styles.addr}>{item.pickupAddress}</Text>
            <Text style={styles.arrow}>↓</Text>
            <Text style={styles.addr}>{item.dropoffAddress}</Text>
            <Text style={styles.cost}>${item.estimatedCost} estimated</Text>

            <View style={styles.actions}>
              {item.status === 'pending' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1a73e8' }]} onPress={() => accept(item.id)}>
                  <Text style={styles.actionTxt}>Accept</Text>
                </TouchableOpacity>
              )}
              {item.status === 'confirmed' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#34a853' }]} onPress={() => startTrip(item)}>
                  <Text style={styles.actionTxt}>Start Trip</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '800', color: '#222', marginTop: 50, marginBottom: 20 },
  empty: { textAlign: 'center', color: '#999', marginTop: 60 },
  card: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, marginBottom: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  passenger: { fontWeight: '800', color: '#222', fontSize: 16 },
  status: { fontWeight: '700', textTransform: 'capitalize' },
  date: { color: '#1a73e8', marginBottom: 8, fontWeight: '600' },
  addr: { color: '#444', fontSize: 14 },
  arrow: { color: '#999', marginVertical: 2 },
  cost: { color: '#34a853', fontWeight: '700', marginTop: 8 },
  actions: { flexDirection: 'row', marginTop: 12, gap: 10 },
  actionBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  actionTxt: { color: '#fff', fontWeight: '700' },
});
