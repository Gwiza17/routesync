import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import api from '../../services/api';

const STATUS_COLORS = { pending: '#f4b400', confirmed: '#1a73e8', in_progress: '#34a853', completed: '#666', cancelled: '#ea4335' };

export default function MyBookingsScreen({ navigation }) {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Trips</Text>
      <FlatList
        data={bookings}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.empty}>No bookings yet</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => item.status === 'in_progress' && navigation.navigate('TripTracking', { booking: item })}
          >
            <View style={styles.row}>
              <Text style={styles.date}>{item.schedule?.date}</Text>
              <Text style={[styles.status, { color: STATUS_COLORS[item.status] }]}>{item.status.replace('_', ' ')}</Text>
            </View>
            <Text style={styles.addr}>{item.pickupAddress}</Text>
            <Text style={styles.arrow}>↓</Text>
            <Text style={styles.addr}>{item.dropoffAddress}</Text>
            <Text style={styles.cost}>${item.estimatedCost} estimated</Text>
            {item.status === 'in_progress' && (
              <Text style={styles.trackHint}>Tap to track live →</Text>
            )}
          </TouchableOpacity>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  date: { fontWeight: '700', color: '#222' },
  status: { fontWeight: '700', textTransform: 'capitalize' },
  addr: { color: '#444', fontSize: 14 },
  arrow: { color: '#999', marginVertical: 2, fontSize: 12 },
  cost: { color: '#34a853', fontWeight: '700', marginTop: 8 },
  trackHint: { color: '#1a73e8', fontSize: 12, marginTop: 4 },
});
