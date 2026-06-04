import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AddressSearch from '../../components/AddressSearch';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { colors, spacing, radius, typography } from '../../theme';

const VERIFY_DISMISSED_KEY = 'verify_banner_dismissed';
const DEFAULT_DRIVER_KEY = 'default_driver';

// Generate time slots 06:00 – 21:00 in 30-minute steps
const TIME_SLOTS = Array.from({ length: 32 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

const todayISO = () => new Date().toISOString().split('T')[0];
const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

// ── Main component ─────────────────────────────────────────────────────────
export default function SearchDriverScreen({ navigation }) {
  const { user, logout } = useAuth();

  // Shared
  const [mode, setMode] = useState('id'); // 'id' | 'browse'
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);
  const [defaultDriver, setDefaultDriver] = useState(null);

  // By-ID mode
  const [code, setCode] = useState('');
  const [idLoading, setIdLoading] = useState(false);

  // Browse mode
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState('');
  const [departure, setDeparture] = useState(null);
  const [radius, setRadiusMiles] = useState(25);
  const [results, setResults] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(VERIFY_DISMISSED_KEY).then(val => {
      if (!val) setShowVerifyBanner(true);
    });
    AsyncStorage.getItem(DEFAULT_DRIVER_KEY).then(val => {
      if (val) setDefaultDriver(JSON.parse(val));
    });
  }, []);

  const dismissBanner = async () => {
    await AsyncStorage.setItem(VERIFY_DISMISSED_KEY, 'true');
    setShowVerifyBanner(false);
  };

  const confirmLogout = () =>
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);

  // ── By-ID search ──────────────────────────────────────────────────────────
  const searchById = async () => {
    if (!code.trim()) return;
    setIdLoading(true);
    try {
      const { data } = await api.get(`/drivers/${code.trim().toUpperCase()}`);
      navigation.navigate('DriverProfile', { driver: data });
    } catch {
      Alert.alert('Not Found', 'No driver found with that ID.');
    } finally {
      setIdLoading(false);
    }
  };

  // ── Browse search ─────────────────────────────────────────────────────────
  const browseDrivers = async () => {
    if (!time) return Alert.alert('Select a time', 'Choose a departure time to see available drivers.');
    setBrowseLoading(true);
    setSearched(true);
    try {
      const params = { date, time, radius };
      if (departure?.latitude) {
        params.lat = departure.latitude;
        params.lng = departure.longitude;
      }
      const { data } = await api.get('/drivers/available', { params });
      setResults(data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Search failed');
    } finally {
      setBrowseLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.userName}>{user?.name}</Text>
        <View style={styles.topActions}>
          <TouchableOpacity onPress={() => navigation.navigate('ChatsList')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmLogout} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="log-out-outline" size={26} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Verification nudge */}
      {showVerifyBanner && (
        <View style={styles.verifyBanner}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#92400E" />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.verifyTitle}>Verify your identity</Text>
            <Text style={styles.verifySub}>Drivers trust verified riders. Coming soon.</Text>
          </View>
          <TouchableOpacity onPress={dismissBanner} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={16} color="#92400E" />
          </TouchableOpacity>
        </View>
      )}

      {/* Mode toggle */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'id' && styles.toggleActive]}
          onPress={() => setMode('id')}
        >
          <Ionicons name="search" size={15} color={mode === 'id' ? colors.white : colors.primary} />
          <Text style={[styles.toggleTxt, mode === 'id' && styles.toggleTxtActive]}>By Driver ID</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'browse' && styles.toggleActive]}
          onPress={() => setMode('browse')}
        >
          <Ionicons name="compass-outline" size={15} color={mode === 'browse' ? colors.white : colors.primary} />
          <Text style={[styles.toggleTxt, mode === 'browse' && styles.toggleTxtActive]}>Browse Available</Text>
        </TouchableOpacity>
      </View>

      {/* ── Request a Ride banner ─────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.requestBanner}
        onPress={() => navigation.navigate('RequestRide')}
        activeOpacity={0.85}
      >
        <View style={styles.requestBannerLeft}>
          <Ionicons name="flash" size={20} color={colors.white} />
          <View>
            <Text style={styles.requestBannerTitle}>Need a ride now?</Text>
            <Text style={styles.requestBannerSub}>Request from nearby pool drivers instantly</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.white} />
      </TouchableOpacity>

      {/* ── By-ID mode ────────────────────────────────────────────────────── */}
      {mode === 'id' && (
        <View style={styles.idSection}>
          {/* Default driver card (set via QR scan) */}
          {defaultDriver && (
            <TouchableOpacity
              style={styles.defaultCard}
              onPress={() => navigation.navigate('DriverProfile', { driver: defaultDriver })}
              activeOpacity={0.8}
            >
              <View style={styles.defaultLeft}>
                <View style={styles.defaultAvatar}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.defaultLabel}>Your Driver</Text>
                  <Text style={styles.defaultName}>{defaultDriver.user?.name}</Text>
                  <Text style={styles.defaultCode}>{defaultDriver.driverCode}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}

          <View style={styles.hero}>
            <Ionicons name="car-sport" size={48} color={colors.primary} />
            <Text style={styles.title}>Find Your Driver</Text>
            <Text style={styles.sub}>Enter a Driver ID or scan their QR code</Text>
          </View>

          <View style={styles.idForm}>
            <View style={styles.idInputRow}>
              <Ionicons name="search" size={20} color={colors.muted} style={{ marginLeft: spacing.md }} />
              <TextInput
                style={styles.idInput}
                placeholder="e.g. RS-AB1234"
                placeholderTextColor={colors.muted}
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
                onSubmitEditing={searchById}
              />
            </View>
            <Button label="Search by ID" onPress={searchById} loading={idLoading} size="lg" />

            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() => navigation.navigate('QRScanner')}
            >
              <Ionicons name="qr-code-outline" size={22} color={colors.primary} />
              <Text style={styles.scanTxt}>Scan Driver QR Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Browse mode ───────────────────────────────────────────────────── */}
      {mode === 'browse' && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.browseContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date chips */}
          <Text style={styles.fieldLabel}>Date</Text>
          <View style={styles.dateRow}>
            {[todayISO(), tomorrowISO()].map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.dateChip, date === d && styles.dateChipActive]}
                onPress={() => setDate(d)}
              >
                <Text style={[styles.dateChipTxt, date === d && styles.dateChipTxtActive]}>
                  {d === todayISO() ? 'Today' : 'Tomorrow'}
                </Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={[styles.dateInput, ![todayISO(), tomorrowISO()].includes(date) && styles.dateInputActive]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              value={![todayISO(), tomorrowISO()].includes(date) ? date : ''}
              onChangeText={setDate}
            />
          </View>

          {/* Time slots */}
          <Text style={styles.fieldLabel}>Departure Time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
            {TIME_SLOTS.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.timeChip, time === t && styles.timeChipActive]}
                onPress={() => setTime(t)}
              >
                <Text style={[styles.timeChipTxt, time === t && styles.timeChipTxtActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Departure location */}
          <Text style={styles.fieldLabel}>Departure Location <Text style={styles.optional}>(optional — for distance)</Text></Text>
          <AddressSearch
            placeholder="Where are you departing from?"
            onSelect={setDeparture}
          />

          {/* Radius */}
          <Text style={styles.fieldLabel}>Search Radius</Text>
          <View style={styles.radiusRow}>
            {[10, 25, 50].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.radiusChip, radius === r && styles.radiusChipActive]}
                onPress={() => setRadiusMiles(r)}
              >
                <Text style={[styles.radiusTxt, radius === r && styles.radiusTxtActive]}>{r} mi</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            label="Find Available Drivers"
            onPress={browseDrivers}
            loading={browseLoading}
            size="lg"
            style={{ marginTop: spacing.md }}
          />

          {/* Results */}
          {searched && !browseLoading && (
            results.length === 0
              ? (
                <View style={styles.emptyResults}>
                  <Ionicons name="car-outline" size={40} color={colors.border} />
                  <Text style={styles.emptyTxt}>No drivers available</Text>
                  <Text style={styles.emptySub}>Try a different time, date, or wider radius</Text>
                </View>
              )
              : results.map(({ slot, driver, distanceMiles }) => (
                <Card key={slot.id} style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <View style={styles.resultAvatar}>
                      <Ionicons name="person" size={22} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName}>{driver.user?.name}</Text>
                      <Text style={styles.resultSub}>{driver.vehicle || 'Vehicle not listed'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.resultRate}>${driver.ratePerMile}<Text style={styles.resultRateUnit}>/mi</Text></Text>
                      {distanceMiles !== null && (
                        <Text style={styles.resultDist}>{distanceMiles} mi away</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.resultSlot}>
                    <Ionicons name="time-outline" size={14} color={colors.muted} />
                    <Text style={styles.resultSlotTxt}>{slot.date} · {slot.startTime} – {slot.endTime}</Text>
                  </View>
                  {driver.averageRating > 0 && (
                    <Text style={styles.resultRating}>{'★'.repeat(Math.round(driver.averageRating))}{'☆'.repeat(5 - Math.round(driver.averageRating))} ({driver.totalRatings})</Text>
                  )}
                  <Button
                    label="View Profile & Book"
                    size="sm"
                    style={{ marginTop: spacing.sm }}
                    onPress={() => navigation.navigate('DriverProfile', { driver })}
                  />
                </Card>
              ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  userName: { ...typography.label, color: colors.mid, flex: 1 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },

  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  verifyTitle: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  verifySub: { fontSize: 11, color: '#92400E', marginTop: 1 },

  // Request a Ride banner
  requestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  requestBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  requestBannerTitle: { color: colors.white, fontWeight: '700', fontSize: 14 },
  requestBannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 1 },

  // Mode toggle
  toggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  toggleActive: { backgroundColor: colors.primary },
  toggleTxt: { fontSize: 13, fontWeight: '700', color: colors.primary },
  toggleTxtActive: { color: colors.white },

  // By-ID section
  idSection: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  title: { ...typography.h1, marginTop: spacing.sm, textAlign: 'center' },
  sub: { ...typography.body, textAlign: 'center', marginTop: spacing.xs },
  idForm: { gap: spacing.md },
  idInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  idInput: { flex: 1, padding: 14, fontSize: 20, color: colors.dark, letterSpacing: 3, fontWeight: '700' },

  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    backgroundColor: colors.primaryLight,
  },
  scanTxt: { color: colors.primary, fontWeight: '700', fontSize: 15 },

  defaultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  defaultLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultLabel: { ...typography.caption, color: colors.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  defaultName: { ...typography.label, fontSize: 15 },
  defaultCode: { ...typography.caption, color: colors.primary },

  // Browse section
  browseContent: { padding: spacing.lg, paddingTop: spacing.sm },
  fieldLabel: { ...typography.label, color: colors.muted, marginBottom: spacing.xs, marginTop: spacing.md },
  optional: { fontWeight: '400', fontSize: 12 },

  dateRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  dateChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  dateChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateChipTxt: { fontSize: 13, fontWeight: '600', color: colors.muted },
  dateChipTxtActive: { color: colors.white },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.dark,
  },
  dateInputActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },

  timeScroll: { marginHorizontal: -spacing.lg, paddingLeft: spacing.lg },
  timeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: spacing.xs,
    backgroundColor: colors.white,
  },
  timeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeChipTxt: { fontSize: 13, fontWeight: '600', color: colors.muted },
  timeChipTxtActive: { color: colors.white },

  radiusRow: { flexDirection: 'row', gap: spacing.sm },
  radiusChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  radiusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  radiusTxt: { fontSize: 13, fontWeight: '600', color: colors.muted },
  radiusTxtActive: { color: colors.white },

  emptyResults: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyTxt: { ...typography.h3, color: colors.muted },
  emptySub: { ...typography.body, textAlign: 'center', color: colors.muted },

  resultCard: { marginTop: spacing.md },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  resultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultName: { ...typography.label, fontSize: 15 },
  resultSub: { ...typography.caption, marginTop: 1 },
  resultRate: { fontSize: 18, fontWeight: '900', color: colors.success },
  resultRateUnit: { fontSize: 12, fontWeight: '500' },
  resultDist: { ...typography.caption, color: colors.muted, marginTop: 2 },
  resultSlot: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  resultSlotTxt: { ...typography.caption, color: colors.primary },
  resultRating: { color: colors.warning, fontSize: 13, marginTop: spacing.xs },
});
