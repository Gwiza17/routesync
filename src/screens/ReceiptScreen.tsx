import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Share,
} from 'react-native';
import { colors, spacing, radius } from '../theme';

export default function ReceiptScreen({ route, navigation }: any) {
  const { driver, pickup, dropoff, fare } = route.params;
  const [rating, setRating] = useState(4);

  // Slightly adjust final vs. estimated fare (real vs. estimated miles)
  const finalFare = (parseFloat(fare) + 0.92).toFixed(2);
  const leg1Final = 3.4;
  const leg2Final = 15.1;
  const totalMiles = leg1Final + leg2Final;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `RouteSync Trip Receipt\nDriver: ${driver.name}\nFare: $${finalFare}\nFrom: ${pickup}\nTo: ${dropoff}`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Check icon */}
        <View style={styles.checkCircle}>
          <Text style={styles.checkEmoji}>✅</Text>
        </View>

        <Text style={styles.title}>Trip Complete!</Text>
        <Text style={styles.sub}>
          You've arrived at {dropoff.length > 35 ? dropoff.slice(0, 35) + '…' : dropoff}
        </Text>

        {/* Fare */}
        <Text style={styles.fareAmount}>${finalFare}</Text>
        <Text style={styles.fareNote}>Final fare · Charged to Visa ••••4821</Text>

        {/* Breakdown */}
        <View style={styles.breakdownCard}>
          <View style={styles.bRow}>
            <Text style={styles.bLbl}>Leg 1 — Driver to Pickup</Text>
            <Text style={styles.bVal}>{leg1Final} mi</Text>
          </View>
          <View style={styles.bRow}>
            <Text style={styles.bLbl}>Leg 2 — Pickup to Drop-off</Text>
            <Text style={styles.bVal}>{leg2Final} mi</Text>
          </View>
          <View style={styles.bRow}>
            <Text style={styles.bLbl}>Total Miles</Text>
            <Text style={styles.bVal}>{totalMiles} mi</Text>
          </View>
          <View style={styles.bRow}>
            <Text style={styles.bLbl}>Rate Per Mile</Text>
            <Text style={styles.bVal}>× ${driver.ratePerMile.toFixed(2)}</Text>
          </View>
          <View style={[styles.bRow, styles.bRowTotal]}>
            <Text style={styles.bTotalLbl}>Final Fare</Text>
            <Text style={styles.bTotalVal}>${finalFare}</Text>
          </View>
        </View>

        {/* Driver summary */}
        <View style={styles.driverRow}>
          <View style={[styles.driverPic, { backgroundColor: driver.color + '33' }]}>
            <Text style={styles.driverEmoji}>{driver.emoji}</Text>
          </View>
          <View>
            <Text style={styles.driverName}>{driver.name}</Text>
            <Text style={styles.driverMeta}>{driver.vehicle} · {driver.id}</Text>
          </View>
        </View>

        {/* Rating */}
        <Text style={styles.ratingLabel}>Rate Your Driver</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
              <Text style={[styles.star, star <= rating && styles.starActive]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingHint}>Tap to rate {driver.firstName}</Text>

        {/* Actions */}
        <TouchableOpacity
          style={styles.rebookBtn}
          onPress={() => navigation.navigate('DriverProfile', { driver })}
          activeOpacity={0.85}
        >
          <Text style={styles.rebookText}>📅  Rebook This Driver</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
          <Text style={styles.shareText}>Share Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.85}
        >
          <Text style={styles.doneBtnText}>Back to Home</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: 20 },
  checkCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 3,
    borderColor: 'rgba(52,211,153,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  checkEmoji: { fontSize: 34 },
  title: { fontSize: 24, fontWeight: '800', color: colors.white, marginBottom: 4 },
  sub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: 20 },
  fareAmount: {
    fontSize: 54,
    fontWeight: '900',
    color: colors.purpleLight,
    marginBottom: 4,
  },
  fareNote: { fontSize: 12, color: colors.textDim, marginBottom: 20 },
  breakdownCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  bRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgInput,
  },
  bLbl: { fontSize: 13, color: colors.textMuted },
  bVal: { fontSize: 13, fontWeight: '700', color: colors.white },
  bRowTotal: {
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderBottomWidth: 0,
  },
  bTotalLbl: { fontSize: 14, fontWeight: '700', color: colors.white },
  bTotalVal: { fontSize: 18, fontWeight: '900', color: colors.purpleLight },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 12,
    marginBottom: 20,
  },
  driverPic: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverEmoji: { fontSize: 24 },
  driverName: { fontSize: 14, fontWeight: '700', color: colors.white },
  driverMeta: { fontSize: 11, color: colors.textDim },
  ratingLabel: { fontSize: 13, fontWeight: '700', color: colors.white, marginBottom: 10 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  star: { fontSize: 36, color: colors.border },
  starActive: { color: colors.amber },
  ratingHint: { fontSize: 12, color: colors.textDim, marginBottom: 24 },
  rebookBtn: {
    alignSelf: 'stretch',
    backgroundColor: colors.purple,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  rebookText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  shareBtn: {
    alignSelf: 'stretch',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  shareText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  doneBtn: {
    alignSelf: 'stretch',
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnText: { color: colors.textDim, fontSize: 14 },
});
