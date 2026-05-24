import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { colors, spacing, typography } from '../../theme';

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
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>No trips yet</Text>
            <Text style={styles.emptySub}>Search for a driver to book your first trip</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.driverName}>{item.driver?.user?.name}</Text>
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

            <View style={styles.cardFooter}>
              <Text style={styles.cost}>${item.estimatedCost} est.</Text>
              <View style={styles.actions}>
                {item.status === 'in_progress' && (
                  <Button label="Track Live" size="sm" onPress={() => navigation.navigate('TripTracking', { booking: item })} />
                )}
                {item.status === 'completed' && (
                  <Button label="Rate Driver ★" size="sm" variant="outline" onPress={() => navigation.navigate('RateDriver', { booking: item })} />
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
  emptyState: { alignItems: 'center', marginTop: 80, gap: spacing.sm },
  emptyText: { ...typography.h3, color: colors.muted },
  emptySub: { ...typography.body, textAlign: 'center' },
  card: { marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  driverName: { ...typography.h3 },
  date: { ...typography.caption, color: colors.primary, marginTop: 2 },
  route: { backgroundColor: colors.surface, borderRadius: 8, padding: spacing.sm, marginBottom: spacing.md, gap: spacing.xs },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  routeLine: { width: 1, height: 12, backgroundColor: colors.border, marginLeft: 7 },
  addr: { ...typography.body, fontSize: 13, flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cost: { ...typography.label, color: colors.success },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
