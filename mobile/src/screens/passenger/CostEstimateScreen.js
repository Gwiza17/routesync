import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import ScreenHeader from '../../components/ui/ScreenHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { colors, spacing, typography, radius } from '../../theme';

export default function CostEstimateScreen({ route, navigation }) {
  const { estimate, slot, driver, pickup, dropoff } = route.params;
  const [loading, setLoading] = useState(false);

  const confirmBooking = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/bookings', {
        scheduleId: slot.id,
        pickupAddress: pickup.address,
        pickupLatitude: pickup.latitude,
        pickupLongitude: pickup.longitude,
        dropoffAddress: dropoff.address,
        dropoffLatitude: dropoff.latitude,
        dropoffLongitude: dropoff.longitude,
      });
      Alert.alert('Booking Confirmed!', `Estimated cost: $${data.estimatedCost}`, [
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
      <ScreenHeader title="Trip Summary" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>

        <Card style={{ marginBottom: spacing.md }}>
          <Row label="Driver" value={`${driver.user?.name}`} />
          <Row label="Driver ID" value={driver.driverCode} valueColor={colors.primary} />
          <Row label="Date" value={`${slot.date} · ${slot.startTime}`} />
          <View style={styles.routeBlock}>
            <View style={styles.routeRow}>
              <Ionicons name="radio-button-on" size={14} color={colors.primary} />
              <Text style={styles.routeAddr} numberOfLines={2}>{pickup.address}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeRow}>
              <Ionicons name="location" size={14} color={colors.danger} />
              <Text style={styles.routeAddr} numberOfLines={2}>{dropoff.address}</Text>
            </View>
          </View>
        </Card>

        <Card style={{ marginBottom: spacing.md }}>
          <Row label="Rate per mile" value={`$${estimate.ratePerMile}`} />
          <Row label="Driver → Pick-up" value={`${estimate.leg1Miles} mi`} />
          {estimate.leg1DurationMinutes && <Row label="Drive time (leg 1)" value={`~${estimate.leg1DurationMinutes} min`} />}
          <Row label="Pick-up → Drop-off" value={`${estimate.leg2Miles} mi`} />
          {estimate.leg2DurationMinutes && <Row label="Drive time (leg 2)" value={`~${estimate.leg2DurationMinutes} min`} />}
          <View style={styles.divider} />
          <Row label="Total distance" value={`${estimate.totalMiles} mi`} bold />
        </Card>

        <Card style={styles.costCard}>
          <Text style={styles.costLabel}>Estimated Total</Text>
          <Text style={styles.cost}>${estimate.estimatedCost}</Text>
          <Text style={styles.costNote}>Final cost may vary slightly based on actual route</Text>
        </Card>

        <Button label="Confirm & Book" onPress={confirmBooking} loading={loading} variant="success" size="lg" style={{ marginTop: spacing.md }} />
        <Button label="Edit Locations" onPress={() => navigation.goBack()} variant="ghost" style={{ marginTop: spacing.sm }} />
      </ScrollView>
    </View>
  );
}

const Row = ({ label, value, bold, valueColor }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
    <Text style={{ color: colors.muted, flex: 1 }}>{label}</Text>
    <Text style={{ fontWeight: bold ? '800' : '500', color: valueColor || colors.dark, flex: 1, textAlign: 'right' }}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.md },
  routeBlock: { marginTop: spacing.sm, gap: spacing.xs },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  routeLine: { width: 1, height: 12, backgroundColor: colors.border, marginLeft: 7 },
  routeAddr: { ...typography.body, fontSize: 13, flex: 1 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  costCard: { backgroundColor: colors.successLight, alignItems: 'center', padding: spacing.lg },
  costLabel: { ...typography.label, color: colors.success, textTransform: 'uppercase', letterSpacing: 1 },
  cost: { fontSize: 52, fontWeight: '900', color: colors.success, marginVertical: spacing.sm },
  costNote: { ...typography.caption, textAlign: 'center', color: colors.mid },
});
