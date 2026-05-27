import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors, spacing, radius } from '../theme';

// Sample route coordinates through Indianapolis
const ROUTE_COORDS = [
  { latitude: 39.9784, longitude: -86.0214 }, // driver start
  { latitude: 39.9712, longitude: -86.0180 },
  { latitude: 39.9650, longitude: -86.0120 },
  { latitude: 39.9589, longitude: -86.0064 }, // pickup
  { latitude: 39.9430, longitude: -86.0280 },
  { latitude: 39.9200, longitude: -86.0680 },
  { latitude: 39.7173, longitude: -86.2944 }, // airport
];

const PICKUP_COORD = { latitude: 39.9589, longitude: -86.0064 };
const DROPOFF_COORD = { latitude: 39.7173, longitude: -86.2944 };
const DRIVER_START = { latitude: 39.9784, longitude: -86.0214 };

const INSTRUCTIONS = [
  { text: 'Turn left on Meridian St', sub: 'Then continue 0.6 mi to pickup', dist: '0.4 mi' },
  { text: 'Continue on 86th St', sub: 'Head west toward Michigan Rd', dist: '1.2 mi' },
  { text: 'Arriving at pickup location', sub: '4821 Carmel Dr — passenger waiting', dist: '0.1 mi' },
  { text: 'Head south on Georgetown Rd', sub: 'Toward I-465 W', dist: '2.3 mi' },
  { text: 'Merge onto I-465 W', sub: 'Continue 8 miles toward Airport', dist: '8.0 mi' },
  { text: 'Take exit 11B for Airport', sub: 'Indianapolis International Airport', dist: '0.5 mi' },
];

export default function LiveTripScreen({ route, navigation }: any) {
  const { driver, pickup, dropoff, fare } = route.params;
  const [instrIdx, setInstrIdx] = useState(0);
  const [phase, setPhase] = useState<'to-pickup' | 'to-dropoff'>('to-pickup');
  const [eta, setEta] = useState({ pickup: 14, total: 38 });
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for live dot
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();

    // Rotate through instructions every 6s (demo)
    const instrTimer = setInterval(() => {
      setInstrIdx(i => {
        const next = (i + 1) % INSTRUCTIONS.length;
        if (next === 3) setPhase('to-dropoff');
        return next;
      });
    }, 6000);

    // Count down ETA
    const etaTimer = setInterval(() => {
      setEta(e => ({
        pickup: Math.max(0, e.pickup - 1),
        total: Math.max(0, e.total - 1),
      }));
    }, 60000);

    return () => {
      pulse.stop();
      clearInterval(instrTimer);
      clearInterval(etaTimer);
    };
  }, []);

  const instr = INSTRUCTIONS[instrIdx];

  const handleEndTrip = () => {
    Alert.alert('End Trip', 'Are you sure you want to end this trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Trip',
        style: 'destructive',
        onPress: () =>
          navigation.navigate('Receipt', {
            driver,
            pickup,
            dropoff,
            fare,
          }),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 39.87,
          longitude: -86.16,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
        customMapStyle={darkMapStyle}
      >
        {/* Route polyline */}
        <Polyline
          coordinates={ROUTE_COORDS}
          strokeColor={colors.purple}
          strokeWidth={4}
          lineDashPattern={[8, 4]}
        />

        {/* Driver marker */}
        <Marker coordinate={DRIVER_START} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.driverMarker}>
            <Text style={styles.driverMarkerEmoji}>{driver.emoji}</Text>
          </View>
        </Marker>

        {/* Pickup marker */}
        <Marker coordinate={PICKUP_COORD}>
          <View style={styles.pinBubble}>
            <Text style={styles.pinText}>Pickup 📍</Text>
          </View>
        </Marker>

        {/* Dropoff marker */}
        <Marker coordinate={DROPOFF_COORD}>
          <View style={[styles.pinBubble, styles.pinBubbleGreen]}>
            <Text style={styles.pinText}>Airport ✈</Text>
          </View>
        </Marker>
      </MapView>

      {/* Navigation instruction overlay */}
      <View style={styles.instrOverlay}>
        <View style={styles.instrCard}>
          <View style={styles.turnIcon}>
            <Text style={styles.turnEmoji}>↰</Text>
          </View>
          <View style={styles.instrText}>
            <Text style={styles.instrMain}>{instr.text}</Text>
            <Text style={styles.instrSub}>{instr.sub}</Text>
          </View>
          <Text style={styles.instrDist}>{instr.dist}</Text>
        </View>
      </View>

      {/* Bottom trip panel */}
      <View style={styles.tripPanel}>
        <View style={styles.panelHandle} />

        {/* Status chip */}
        <View style={styles.statusChip}>
          <Animated.View style={[styles.statusDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.statusText}>
            {phase === 'to-pickup' ? 'En Route to Pickup' : 'Trip In Progress'}
          </Text>
        </View>

        {/* Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{eta.pickup} min</Text>
            <Text style={styles.metricLbl}>To Pickup</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{eta.total} min</Text>
            <Text style={styles.metricLbl}>Total ETA</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={[styles.metricVal, { color: colors.purpleLight }]}>${fare}</Text>
            <Text style={styles.metricLbl}>Est. Fare</Text>
          </View>
        </View>

        {/* Waypoints */}
        <View style={styles.waypoints}>
          <View style={styles.wp}>
            <View style={[styles.wpIcon, { backgroundColor: 'rgba(124,58,237,0.2)' }]}>
              <Text style={styles.wpEmoji}>🟣</Text>
            </View>
            <View style={styles.wpText}>
              <Text style={styles.wpTitle}>Pickup — {pickup.split(',')[0]}</Text>
              <Text style={styles.wpSub}>Driver en route · Arrives ~{eta.pickup > 0 ? `${eta.pickup} min` : 'Now'}</Text>
            </View>
          </View>
          <View style={styles.wp}>
            <View style={[styles.wpIcon, { backgroundColor: 'rgba(52,211,153,0.15)' }]}>
              <Text style={styles.wpEmoji}>✈</Text>
            </View>
            <View style={styles.wpText}>
              <Text style={styles.wpTitle}>Drop-off — {dropoff.length > 28 ? dropoff.slice(0, 28) + '…' : dropoff}</Text>
              <Text style={styles.wpSub}>ETA in {eta.total} min</Text>
            </View>
          </View>
        </View>

        {/* End trip */}
        <TouchableOpacity style={styles.endBtn} onPress={handleEndTrip} activeOpacity={0.85}>
          <Text style={styles.endBtnText}>🛑  End Trip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Dark map style for Google Maps
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1d2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f111a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2d3e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1d2e' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#374151' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f111a' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  map: { flex: 1 },
  instrOverlay: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    zIndex: 10,
  },
  instrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,17,26,0.92)',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
  },
  turnIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnEmoji: { fontSize: 20, color: colors.white },
  instrText: { flex: 1 },
  instrMain: { fontSize: 13, fontWeight: '700', color: colors.white },
  instrSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  instrDist: { fontSize: 14, fontWeight: '800', color: colors.purpleLight, textAlign: 'right' },
  tripPanel: {
    backgroundColor: '#15172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingTop: 14,
    marginTop: -20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  panelHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(52,211,153,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.25)',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 7,
    marginBottom: spacing.md,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  statusText: { fontSize: 12, fontWeight: '700', color: colors.green },
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  metricBox: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 10,
    alignItems: 'center',
  },
  metricVal: { fontSize: 16, fontWeight: '800', color: colors.white },
  metricLbl: { fontSize: 10, color: colors.textDim, marginTop: 2 },
  waypoints: { marginBottom: spacing.md, gap: 4 },
  wp: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgInput,
    gap: 10,
  },
  wpIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wpEmoji: { fontSize: 14 },
  wpText: { flex: 1 },
  wpTitle: { fontSize: 13, fontWeight: '700', color: colors.white },
  wpSub: { fontSize: 11, color: colors.textDim, marginTop: 1 },
  endBtn: {
    backgroundColor: colors.red,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: colors.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  endBtnText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  driverMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.purple,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  driverMarkerEmoji: { fontSize: 18 },
  pinBubble: {
    backgroundColor: colors.purple,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    elevation: 3,
  },
  pinBubbleGreen: { backgroundColor: '#059669' },
  pinText: { color: colors.white, fontSize: 11, fontWeight: '700' },
});
