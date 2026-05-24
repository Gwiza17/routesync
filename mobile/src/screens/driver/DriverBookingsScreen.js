import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { colors, spacing, typography } from '../../theme';

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

  const updateStatus = async (id, status, booking) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      if (status === 'in_progress') {
        navigation.navigate('ActiveTrip', { booking: { ...booking, status: 'in_progress' } });
      } else {
        setBookings(b => b.map(bk => bk.id === id ? { ...bk, status } : bk));
      }
    } catch {
      Alert.alert('Error', 'Could not update booking');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>No bookings yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.passengerName}>{item.passenger?.name}</Text>
                <Text style={styles.date}>{item.schedule?.date} · {item.schedule?.startTime}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>

            <View style={styles.route}>
              <View style={styles.routeRow}>
                <Ionicons name="radio-button-on" size={14} color={colors.primary} />
                <Text style={styles.addr} numberOfLines={1}>{item.pickupAddress}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeRow}>
                <Ionicons name="location" size={14} color={colors.danger} />
                <Text style={styles.addr} numberOfLines={1}>{item.dropoffAddress}</Text>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.cost}>${item.estimatedCost} est.</Text>
              <View style={styles.actions}>
                {item.status === 'pending' && (
                  <>
                    <Button label="Decline" onPress={() => updateStatus(item.id, 'cancelled', item)} variant="outline" size="sm" style={{ flex: 1 }} />
                    <Button label="Accept" onPress={() => updateStatus(item.id, 'confirmed', item)} size="sm" style={{ flex: 1 }} />
                  </>
                )}
                {item.status === 'confirmed' && (
                  <Button label="Start Trip →" onPress={() => updateStatus(item.id, 'in_progress', item)} variant="success" size="sm" style={{ flex: 1 }} />
                )}
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  title: { ...typography.h1, padding: spacing.lg, paddingTop: 60, backgroundColor: colors.white },
  list: { padding: spacing.md },
  emptyState: { alignItems: 'center', marginTop: 80, gap: spacing.md },
  emptyText: { ...typography.body, color: colors.muted },
  card: { marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  passengerName: { ...typography.h3 },
  date: { ...typography.caption, color: colors.primary, marginTop: 2 },
  route: { backgroundColor: colors.surface, borderRadius: 8, padding: spacing.sm, marginBottom: spacing.md },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  routeLine: { width: 1, height: 12, backgroundColor: colors.border, marginLeft: 7 },
  addr: { ...typography.body, fontSize: 13, flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  cost: { ...typography.label, color: colors.success, fontSize: 16 },
  actions: { flex: 1, flexDirection: 'row', gap: spacing.sm },
});
