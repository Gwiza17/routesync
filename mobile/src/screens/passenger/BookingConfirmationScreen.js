import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ui/ScreenHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { colors, spacing, typography, radius } from '../../theme';

export default function BookingConfirmationScreen({ route, navigation }) {
  const { booking, driver, slot, pickup, dropoff, estimatedCost } = route.params;

  const goHome = () =>
    navigation.reset({ index: 0, routes: [{ name: 'PassengerTabs' }] });

  return (
    <View style={styles.container}>
      <ScreenHeader title="Booking Confirmed" />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Success badge */}
        <View style={styles.successBadge}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={48} color={colors.white} />
          </View>
          <Text style={styles.successTitle}>You're booked!</Text>
          <Text style={styles.successSub}>
            Your trip has been confirmed. The driver will be notified.
          </Text>
        </View>

        {/* Booking details */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Trip Details</Text>
          <Row label="Driver" value={driver?.user?.name} />
          <Row label="Driver ID" value={driver?.driverCode} valueColor={colors.primary} />
          <Row label="Date" value={slot?.date} />
          <Row label="Time" value={`${slot?.startTime} – ${slot?.endTime}`} />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Route</Text>
          <View style={styles.routeBlock}>
            <View style={styles.routeRow}>
              <Ionicons name="radio-button-on" size={14} color={colors.primary} />
              <Text style={styles.routeAddr} numberOfLines={2}>{pickup?.address}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeRow}>
              <Ionicons name="location" size={14} color={colors.danger} />
              <Text style={styles.routeAddr} numberOfLines={2}>{dropoff?.address}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.costCard}>
          <Text style={styles.costLabel}>Estimated Cost</Text>
          <Text style={styles.cost}>${estimatedCost}</Text>
          <Text style={styles.costNote}>
            Payment is collected by the driver after your trip
          </Text>
        </Card>

        <Button
          label="Return to Main Menu"
          onPress={goHome}
          size="lg"
          style={{ marginTop: spacing.md }}
        />
        <Button
          label="View My Trips"
          onPress={() => {
            goHome();
            // Navigate into the My Trips tab
            setTimeout(() => navigation.navigate('PassengerTabs', { screen: 'My Trips' }), 100);
          }}
          variant="outline"
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </View>
  );
}

const Row = ({ label, value, valueColor }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, valueColor && { color: valueColor }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },

  successBadge: { alignItems: 'center', paddingVertical: spacing.xl },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successTitle: { ...typography.h1, color: colors.success, marginBottom: spacing.xs },
  successSub: { ...typography.body, textAlign: 'center', color: colors.mid, paddingHorizontal: spacing.lg },

  card: { marginBottom: spacing.md },
  cardTitle: { ...typography.label, color: colors.muted, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { color: colors.muted, flex: 1 },
  rowValue: { fontWeight: '600', color: colors.dark, flex: 1, textAlign: 'right' },

  routeBlock: { gap: spacing.xs },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  routeLine: { width: 1, height: 14, backgroundColor: colors.border, marginLeft: 7 },
  routeAddr: { ...typography.body, fontSize: 13, flex: 1 },

  costCard: { backgroundColor: colors.successLight, alignItems: 'center', padding: spacing.lg, marginBottom: spacing.md },
  costLabel: { ...typography.label, color: colors.success, textTransform: 'uppercase', letterSpacing: 1 },
  cost: { fontSize: 48, fontWeight: '900', color: colors.success, marginVertical: spacing.sm },
  costNote: { ...typography.caption, textAlign: 'center', color: colors.mid },
});
