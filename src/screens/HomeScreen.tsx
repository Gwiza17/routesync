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
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { DRIVERS, RECENT_TRIP } from '../data/mockData';

export default function HomeScreen({ navigation }: any) {
  const [search, setSearch] = useState('');

  const filtered = DRIVERS.filter(
    d =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.headTitle}>Find a Driver 👋</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>CM</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or Driver ID…"
            placeholderTextColor={colors.textDim}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Section label */}
        <Text style={styles.sectionLabel}>Trusted Drivers Near You</Text>

        {/* Driver cards */}
        {filtered.map(driver => (
          <TouchableOpacity
            key={driver.id}
            style={styles.driverCard}
            onPress={() => navigation.navigate('DriverProfile', { driver })}
            activeOpacity={0.8}
          >
            <View style={[styles.driverAvatar, { backgroundColor: driver.color + '22' }]}>
              <Text style={styles.driverEmoji}>{driver.emoji}</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <Text style={styles.driverMeta}>
                ⭐ {driver.rating} · {driver.vehicle} · ID: {driver.id}
              </Text>
            </View>
            <View style={styles.driverBadge}>
              <View style={styles.rateTag}>
                <Text style={styles.rateText}>${driver.ratePerMile.toFixed(2)}/mi</Text>
              </View>
              {driver.available ? (
                <View style={styles.availRow}>
                  <View style={styles.availDot} />
                  <Text style={styles.availText}>Available</Text>
                </View>
              ) : (
                <Text style={styles.unavailText}>Off Today</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Quick rebook */}
        <View style={styles.rebookCard}>
          <Text style={styles.rebookIcon}>⚡</Text>
          <View style={styles.rebookInfo}>
            <Text style={styles.rebookTitle}>Quick Rebook</Text>
            <Text style={styles.rebookSub}>
              {RECENT_TRIP.driverName} · {RECENT_TRIP.date} {RECENT_TRIP.time} · {RECENT_TRIP.destination}
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        {[
          { icon: '🏠', label: 'Home', active: true },
          { icon: '📅', label: 'Bookings', active: false },
          { icon: '🗺', label: 'Trips', active: false },
          { icon: '👤', label: 'Profile', active: false },
        ].map(item => (
          <TouchableOpacity key={item.label} style={styles.navItem}>
            <Text style={styles.navIcon}>{item.icon}</Text>
            <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  greeting: { fontSize: 12, color: colors.textDim, fontWeight: '600' },
  headTitle: { fontSize: 24, fontWeight: '800', color: colors.white },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.bgInput,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: colors.white, fontSize: 14 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textDim,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: 10,
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 12,
  },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverEmoji: { fontSize: 28 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 15, fontWeight: '700', color: colors.white },
  driverMeta: { fontSize: 12, color: colors.textDim, marginTop: 3 },
  driverBadge: { alignItems: 'flex-end', gap: 5 },
  rateTag: {
    backgroundColor: colors.purpleMuted,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rateText: { color: colors.purpleLight, fontSize: 12, fontWeight: '700' },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  availDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  availText: { fontSize: 11, color: colors.green },
  unavailText: { fontSize: 11, color: colors.red },
  rebookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: 6,
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(124,58,237,0.2)',
    padding: spacing.md,
    gap: 12,
  },
  rebookIcon: { fontSize: 28 },
  rebookInfo: { flex: 1 },
  rebookTitle: { fontSize: 14, fontWeight: '700', color: colors.white },
  rebookSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.bgInput,
    paddingVertical: 10,
    paddingBottom: 16,
    backgroundColor: colors.bg,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 10, fontWeight: '600', color: colors.textDim },
  navLabelActive: { color: colors.purple },
});
