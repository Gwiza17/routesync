import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AddressSearch from '../../components/AddressSearch';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { colors, spacing, radius, typography } from '../../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';
const TTL_SECS = 5 * 60; // 5 minutes matches server expiresAt

const pad2 = n => n.toString().padStart(2, '0');
const fmtSecs = s => `${Math.floor(s / 60)}:${pad2(s % 60)}`;

export default function RequestRideScreen({ navigation }) {
  const { user } = useAuth();

  const [pickup,  setPickup]  = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pending request state
  const [rideRequest,  setRideRequest]  = useState(null);
  const [secondsLeft,  setSecondsLeft]  = useState(TTL_SECS);

  // Terminal states
  const [acceptedRide, setAcceptedRide] = useState(null); // ride:accepted payload
  const [noDrivers,    setNoDrivers]    = useState(false);

  const socketRef = useRef(null);
  const timerRef  = useRef(null);

  // ── Socket setup — connect once, join user room ───────────────────────────
  useEffect(() => {
    const sock = io(API_URL, { transports: ['websocket'] });
    socketRef.current = sock;
    sock.emit('join:user', { userId: user.id });

    sock.on('ride:accepted', (data) => {
      clearInterval(timerRef.current);
      setRideRequest(null);
      setAcceptedRide(data);
    });

    sock.on('ride:no_drivers', () => {
      clearInterval(timerRef.current);
      setRideRequest(null);
      setNoDrivers(true);
    });

    return () => {
      sock.disconnect();
      clearInterval(timerRef.current);
    };
  }, [user.id]);

  // ── Request a ride ────────────────────────────────────────────────────────
  const handleRequest = async () => {
    if (!pickup || !dropoff) {
      return Alert.alert('Missing addresses', 'Please enter both a pickup and a dropoff location.');
    }
    setLoading(true);
    setNoDrivers(false);
    try {
      const { data } = await api.post('/ride-requests', {
        pickupAddress:    pickup.address,
        pickupLatitude:   pickup.latitude,
        pickupLongitude:  pickup.longitude,
        dropoffAddress:   dropoff.address,
        dropoffLatitude:  dropoff.latitude,
        dropoffLongitude: dropoff.longitude,
      });
      setRideRequest(data);
      setSecondsLeft(TTL_SECS);

      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setRideRequest(null);
            setNoDrivers(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not send ride request. Try again.';
      Alert.alert('Request Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Cancel pending request ────────────────────────────────────────────────
  const handleCancel = async () => {
    clearInterval(timerRef.current);
    const id = rideRequest?.id;
    setRideRequest(null);
    if (id) {
      try { await api.delete(`/ride-requests/${id}`); } catch {}
    }
  };

  // ── SUCCESS STATE — driver accepted ──────────────────────────────────────
  if (acceptedRide) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ride Confirmed</Text>
        </View>

        <ScrollView contentContainerStyle={styles.successScroll}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={52} color={colors.white} />
          </View>
          <Text style={styles.successTitle}>Driver Found!</Text>
          <Text style={styles.successSub}>Your driver accepted and is on their way</Text>

          <Card style={styles.driverCard}>
            <View style={styles.driverRow}>
              <View style={styles.driverAvatar}>
                <Ionicons name="person" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.driverName}>{acceptedRide.driverName}</Text>
                <Text style={styles.driverVehicle}>{acceptedRide.vehicle || 'Vehicle not listed'}</Text>
                {acceptedRide.licensePlate ? (
                  <Text style={styles.driverPlate}>{acceptedRide.licensePlate}</Text>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Text style={styles.driverRate}>
                  ${parseFloat(acceptedRide.ratePerMile).toFixed(2)}
                  <Text style={{ fontSize: 11, fontWeight: '400' }}>/mi</Text>
                </Text>
                <Text style={styles.driverDist}>{acceptedRide.distanceMiles} mi</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Estimated Total</Text>
              <Text style={styles.costValue}>${parseFloat(acceptedRide.estimatedCost).toFixed(2)}</Text>
            </View>
          </Card>

          {/* Route summary */}
          <Card style={styles.routeCard}>
            <View style={styles.routeRow}>
              <Ionicons name="radio-button-on" size={14} color={colors.success} />
              <Text style={styles.routeAddr} numberOfLines={2}>{pickup?.address}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeRow}>
              <Ionicons name="location" size={14} color={colors.danger} />
              <Text style={styles.routeAddr} numberOfLines={2}>{dropoff?.address}</Text>
            </View>
          </Card>

          <Button
            label="View My Trips"
            onPress={() => {
              navigation.navigate('PassengerTabs');
              // small delay so tab switches properly
              setTimeout(() => navigation.navigate('My Trips'), 100);
            }}
            style={{ marginTop: spacing.lg }}
          />
          <Button
            label="Back to Search"
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={{ marginTop: spacing.sm }}
          />
        </ScrollView>
      </View>
    );
  }

  // ── MAIN VIEW ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request a Ride</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── WAITING STATE ─────────────────────────────────────────────── */}
        {rideRequest ? (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: spacing.lg }} />
            <Text style={styles.waitingTitle}>Finding Your Driver</Text>
            <Text style={styles.waitingBody}>
              Nearby pool drivers have been notified.{'\n'}Waiting for someone to accept…
            </Text>

            <View style={styles.countdownWrap}>
              <Text style={styles.countdown}>{fmtSecs(secondsLeft)}</Text>
              <Text style={styles.countdownLabel}>Request expires in</Text>
            </View>

            {/* Route summary */}
            <Card style={styles.routeCard}>
              <View style={styles.routeRow}>
                <Ionicons name="radio-button-on" size={14} color={colors.success} />
                <Text style={styles.routeAddr} numberOfLines={1}>{pickup?.address}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeRow}>
                <Ionicons name="location" size={14} color={colors.danger} />
                <Text style={styles.routeAddr} numberOfLines={1}>{dropoff?.address}</Text>
              </View>
              {rideRequest.distanceMiles ? (
                <Text style={styles.distInfo}>
                  {rideRequest.distanceMiles} mi ·{' '}
                  Est. ${rideRequest.estimatedCostMin?.toFixed(2)} – ${rideRequest.estimatedCostMax?.toFixed(2)}
                </Text>
              ) : null}
            </Card>

            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnTxt}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── FORM STATE ─────────────────────────────────────────────── */
          <>
            {noDrivers && (
              <View style={styles.noDriversBanner}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
                <Text style={styles.noDriversTxt}>
                  No nearby drivers accepted your request. Try again or search by Driver ID.
                </Text>
              </View>
            )}

            <Text style={styles.sectionLabel}>Pickup Location</Text>
            <AddressSearch
              placeholder="Where should we pick you up?"
              onSelect={setPickup}
            />

            <Text style={styles.sectionLabel}>Drop-off Location</Text>
            <AddressSearch
              placeholder="Where are you going?"
              onSelect={setDropoff}
            />

            {pickup && dropoff && (
              <View style={styles.infoCard}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} style={{ marginTop: 1 }} />
                <Text style={styles.infoTxt}>
                  Your request goes to all pool drivers within 15 miles. The first to accept gets the trip — rate varies by driver.
                </Text>
              </View>
            )}

            <Button
              label={loading ? 'Sending…' : 'Request Ride'}
              onPress={handleRequest}
              loading={loading}
              size="lg"
              style={[styles.requestBtn, (!pickup || !dropoff) && { opacity: 0.4 }]}
              disabled={!pickup || !dropoff || loading}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backBtn:     { padding: 4 },
  headerTitle: { ...typography.h2 },

  content: { padding: spacing.lg, paddingBottom: spacing.xxl || 48 },

  sectionLabel: { ...typography.label, color: colors.muted, marginTop: spacing.lg, marginBottom: spacing.xs },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  infoTxt: { ...typography.caption, color: colors.primary, flex: 1, lineHeight: 18 },

  requestBtn: { marginTop: spacing.xl },

  noDriversBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noDriversTxt: { ...typography.caption, color: colors.danger, flex: 1, lineHeight: 18 },

  // Waiting state
  waitingContainer: { alignItems: 'center', paddingTop: spacing.xl },
  waitingTitle: { ...typography.h2, marginBottom: spacing.xs },
  waitingBody:  { ...typography.body, textAlign: 'center', color: colors.muted, lineHeight: 22 },

  countdownWrap: { alignItems: 'center', marginVertical: spacing.xl },
  countdown:     { fontSize: 52, fontWeight: '900', color: colors.primary, letterSpacing: 2 },
  countdownLabel: { ...typography.caption, color: colors.muted, marginTop: 4 },

  cancelBtn: {
    marginTop: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
  },
  cancelBtnTxt: { color: colors.danger, fontWeight: '700', fontSize: 15 },

  // Route card (shared)
  routeCard: { width: '100%', marginTop: spacing.lg },
  routeRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  routeAddr: { ...typography.body, flex: 1, color: colors.dark },
  routeLine: {
    width: 1,
    height: 18,
    backgroundColor: colors.border,
    marginLeft: 7,
    marginVertical: 3,
  },
  distInfo: { ...typography.caption, color: colors.primary, marginTop: spacing.sm, fontWeight: '600' },

  // Success state
  successScroll: { alignItems: 'center', padding: spacing.lg, paddingBottom: 48 },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  successTitle: { ...typography.h1, textAlign: 'center' },
  successSub:   { ...typography.body, color: colors.muted, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xl },

  driverCard: { width: '100%', marginBottom: spacing.md },
  driverRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName:    { ...typography.label, fontSize: 16 },
  driverVehicle: { ...typography.caption },
  driverPlate:   { ...typography.caption, color: colors.muted },
  driverRate:    { fontSize: 20, fontWeight: '900', color: colors.success },
  driverDist:    { ...typography.caption, color: colors.muted },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  costRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  costLabel: { ...typography.label, color: colors.muted },
  costValue: { fontSize: 22, fontWeight: '900', color: colors.dark },
});
