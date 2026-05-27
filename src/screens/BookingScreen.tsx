import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  StatusBar,
  Alert,
} from 'react-native';
import { colors, spacing, radius } from '../theme';

export default function BookingScreen({ route, navigation }: any) {
  const { driver, date, time } = route.params;
  const [pickup, setPickup] = useState('4821 Carmel Dr, Carmel, IN 46033');
  const [dropoff, setDropoff] = useState('Indianapolis International Airport');

  // Simulated distance calc (in a real app, use Google Maps Distance Matrix API)
  const leg1Miles = 3.2;  // driver → pickup
  const leg2Miles = 14.7; // pickup → dropoff
  const totalMiles = leg1Miles + leg2Miles;
  const estimatedFare = (totalMiles * driver.ratePerMile).toFixed(2);

  const displayDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Your Trip</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Driver mini card */}
        <View style={styles.driverMini}>
          <View style={[styles.driverPic, { backgroundColor: driver.color + '33' }]}>
            <Text style={styles.driverEmoji}>{driver.emoji}</Text>
          </View>
          <View style={styles.driverMiniInfo}>
            <Text style={styles.driverMiniName}>{driver.name}</Text>
            <Text style={styles.driverMiniMeta}>
              {driver.id} · {driver.vehicle} · {displayDate}
            </Text>
          </View>
          <View style={styles.rateChip}>
            <Text style={styles.rateChipText}>${driver.ratePerMile.toFixed(2)}/mi</Text>
          </View>
        </View>

        {/* Pickup & dropoff */}
        <Text style={styles.formLabel}>PICKUP & DROP-OFF</Text>
        <View style={styles.locationCard}>
          <View style={styles.locRow}>
            <Text style={styles.locIcon}>🟣</Text>
            <TextInput
              style={styles.locInput}
              value={pickup}
              onChangeText={setPickup}
              placeholder="Enter pickup address"
              placeholderTextColor={colors.textFaint}
            />
          </View>
          <View style={styles.locDivider} />
          <View style={styles.locRow}>
            <Text style={styles.locIcon}>🟢</Text>
            <TextInput
              style={styles.locInput}
              value={dropoff}
              onChangeText={setDropoff}
              placeholder="Enter drop-off address"
              placeholderTextColor={colors.textFaint}
            />
          </View>
        </View>

        {/* Date & time */}
        <View style={styles.dtRow}>
          <View style={styles.dtCard}>
            <Text style={styles.dtLabel}>DATE</Text>
            <Text style={styles.dtVal}>{displayDate}</Text>
          </View>
          <View style={styles.dtCard}>
            <Text style={styles.dtLabel}>TIME</Text>
            <Text style={styles.dtVal}>{time}</Text>
          </View>
        </View>

        {/* Fare breakdown */}
        <Text style={styles.formLabel}>FARE BREAKDOWN</Text>
        <View style={styles.fareCard}>
          <Text style={styles.fareTitle}>Cost Calculation</Text>

          <View style={styles.fareRow}>
            <View style={styles.fareRowLeft}>
              <View style={styles.legBadge}>
                <Text style={styles.legBadgeText}>LEG 1</Text>
              </View>
              <Text style={styles.fareRowLbl}>Driver → Pickup</Text>
            </View>
            <Text style={styles.fareRowVal}>{leg1Miles} mi</Text>
          </View>

          <View style={styles.fareRow}>
            <View style={styles.fareRowLeft}>
              <View style={styles.legBadge}>
                <Text style={styles.legBadgeText}>LEG 2</Text>
              </View>
              <Text style={styles.fareRowLbl}>Pickup → Drop-off</Text>
            </View>
            <Text style={styles.fareRowVal}>{leg2Miles} mi</Text>
          </View>

          <View style={styles.fareRow}>
            <Text style={styles.fareRowLbl}>Total Distance</Text>
            <Text style={styles.fareRowVal}>{totalMiles.toFixed(1)} mi</Text>
          </View>

          <View style={styles.fareRow}>
            <Text style={styles.fareRowLbl}>Rate Per Mile</Text>
            <Text style={styles.fareRowVal}>× ${driver.ratePerMile.toFixed(2)}</Text>
          </View>

          <View style={[styles.fareRow, styles.fareTotal]}>
            <Text style={styles.fareTotalLbl}>💰 Estimated Fare</Text>
            <Text style={styles.fareTotalVal}>${estimatedFare}</Text>
          </View>
        </View>

        {/* Payment method */}
        <View style={styles.payCard}>
          <Text style={styles.payIcon}>💳</Text>
          <View>
            <Text style={styles.payTitle}>Visa ••••4821</Text>
            <Text style={styles.paySub}>Default payment method</Text>
          </View>
          <TouchableOpacity style={styles.changeBtn}>
            <Text style={styles.changeBtnText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Confirm button */}
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={() =>
            navigation.navigate('LiveTrip', {
              driver,
              pickup,
              dropoff,
              fare: estimatedFare,
              time,
            })
          }
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Confirm & Book Trip</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: colors.white, fontSize: 18 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.white },
  driverMini: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 10,
  },
  driverPic: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverEmoji: { fontSize: 24 },
  driverMiniInfo: { flex: 1 },
  driverMiniName: { fontSize: 14, fontWeight: '700', color: colors.white },
  driverMiniMeta: { fontSize: 11, color: colors.textDim, marginTop: 2 },
  rateChip: {
    backgroundColor: colors.purpleMuted,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rateChipText: { color: colors.purpleLight, fontSize: 12, fontWeight: '700' },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: 0.6,
    paddingHorizontal: spacing.lg,
    marginBottom: 8,
  },
  locationCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: 10,
  },
  locDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 14 },
  locIcon: { fontSize: 16, width: 22, textAlign: 'center' },
  locInput: { flex: 1, fontSize: 13, color: colors.white },
  dtRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  dtCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 12,
  },
  dtLabel: { fontSize: 10, color: colors.textDim, fontWeight: '700', letterSpacing: 0.5, marginBottom: 3 },
  dtVal: { fontSize: 14, fontWeight: '700', color: colors.white },
  fareCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  fareTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: 0.5,
    padding: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 11,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgInput,
  },
  fareRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fareRowLbl: { fontSize: 13, color: colors.textMuted },
  fareRowVal: { fontSize: 13, fontWeight: '600', color: colors.white },
  legBadge: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  legBadgeText: { fontSize: 10, fontWeight: '700', color: colors.purpleLight },
  fareTotal: {
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderBottomWidth: 0,
  },
  fareTotalLbl: { fontSize: 14, fontWeight: '700', color: colors.white },
  fareTotalVal: { fontSize: 18, fontWeight: '900', color: colors.purpleLight },
  payCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 12,
  },
  payIcon: { fontSize: 22 },
  payTitle: { fontSize: 13, fontWeight: '700', color: colors.white },
  paySub: { fontSize: 11, color: colors.textDim },
  changeBtn: { marginLeft: 'auto' as any },
  changeBtnText: { fontSize: 12, color: colors.purple, fontWeight: '700' },
  confirmBtn: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.purple,
    borderRadius: radius.lg,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmBtnText: { color: colors.white, fontSize: 17, fontWeight: '800' },
});
