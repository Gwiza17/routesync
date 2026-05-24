import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import ScreenHeader from '../../components/ui/ScreenHeader';
import AddressSearch from '../../components/AddressSearch';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';

export default function BookingScreen({ route, navigation }) {
  const { slot, driver } = route.params;
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [extraStops, setExtraStops] = useState([]);
  const [loading, setLoading] = useState(false);

  const getEstimate = async () => {
    if (!pickup || !dropoff) return Alert.alert('Error', 'Select pick-up and drop-off locations');
    setLoading(true);
    try {
      const { data } = await api.post('/bookings/estimate', {
        driverCode: driver.driverCode,
        pickupLat: pickup.latitude,
        pickupLng: pickup.longitude,
        dropoffLat: dropoff.latitude,
        dropoffLng: dropoff.longitude,
      });
      navigation.navigate('CostEstimate', {
        estimate: data, slot, driver, pickup, dropoff,
        stops: [pickup, ...extraStops, dropoff],
      });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not estimate cost');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Book a Trip"
        subtitle={`${slot.date} · ${slot.startTime} – ${slot.endTime}`}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Card style={styles.driverCard}>
          <View style={styles.driverRow}>
            <Ionicons name="person-circle" size={40} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={typography.label}>{driver.user?.name}</Text>
              <Text style={{ ...typography.caption, color: colors.primary }}>{driver.driverCode} · ${driver.ratePerMile}/mi</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionLabel}>Pick-Up Location</Text>
        <AddressSearch placeholder="Where should the driver pick you up?" onSelect={setPickup} />

        {extraStops.map((stop, i) => (
          <View key={i}>
            <View style={styles.stopLabelRow}>
              <Text style={styles.sectionLabel}>Stop {i + 1}</Text>
              <TouchableOpacity onPress={() => setExtraStops(s => s.filter((_, j) => j !== i))}>
                <Ionicons name="close-circle" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
            <AddressSearch placeholder={`Stop ${i + 1}`} onSelect={v => setExtraStops(s => s.map((x, j) => j === i ? v : x))} />
          </View>
        ))}

        <TouchableOpacity style={styles.addStop} onPress={() => setExtraStops(s => [...s, null])}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.addStopTxt}>Add a stop</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Drop-Off Location</Text>
        <AddressSearch placeholder="Final destination" onSelect={setDropoff} />

        {pickup && dropoff && (
          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Ionicons name="radio-button-on" size={14} color={colors.primary} />
              <Text style={styles.summaryAddr} numberOfLines={1}>{pickup.address}</Text>
            </View>
            {extraStops.filter(Boolean).map((s, i) => (
              <View key={i} style={styles.summaryRow}>
                <Ionicons name="ellipse" size={10} color={colors.muted} />
                <Text style={styles.summaryAddr} numberOfLines={1}>{s.address}</Text>
              </View>
            ))}
            <View style={styles.summaryRow}>
              <Ionicons name="location" size={14} color={colors.danger} />
              <Text style={styles.summaryAddr} numberOfLines={1}>{dropoff.address}</Text>
            </View>
          </Card>
        )}

        <Button label="Get Cost Estimate →" onPress={getEstimate} loading={loading} size="lg" style={{ marginTop: spacing.md }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.md },
  driverCard: { marginBottom: spacing.md },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sectionLabel: { ...typography.label, marginBottom: spacing.sm, marginTop: spacing.sm },
  stopLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  addStop: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginVertical: spacing.sm },
  addStopTxt: { color: colors.primary, fontWeight: '600' },
  summaryCard: { backgroundColor: colors.surface, gap: spacing.sm, marginTop: spacing.sm },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryAddr: { ...typography.body, fontSize: 13, flex: 1 },
});
