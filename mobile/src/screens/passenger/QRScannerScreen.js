import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { colors, spacing, typography, radius } from '../../theme';

export default function QRScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const handleScan = async ({ data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    // QR encodes the driver code directly, e.g. "RS-TEST1"
    const code = data.trim().toUpperCase();

    try {
      const { data: driver } = await api.get(`/drivers/${code}`);

      // Link passenger to driver (creates DriverPassenger record — required for private drivers)
      await api.post('/drivers/passengers/link', { driverCode: code }).catch(() => {});

      // Persist as the passenger's default driver
      await AsyncStorage.setItem('default_driver_code', driver.driverCode);
      await AsyncStorage.setItem('default_driver', JSON.stringify(driver));

      // Go straight to their profile
      navigation.replace('DriverProfile', { driver, fromQR: true });
    } catch {
      Alert.alert(
        'QR Not Recognised',
        'This QR code doesn\'t match any RouteSync driver. Ask your driver to share their QR code from the app.',
        [{ text: 'Try Again', onPress: () => setScanned(false) }],
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Permission states ─────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={56} color={colors.muted} />
        <Text style={styles.permTitle}>Camera access needed</Text>
        <Text style={styles.permSub}>RouteSync needs your camera to scan driver QR codes.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnTxt}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkTxt}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Scanner ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Scan Driver QR Code</Text>
        </View>

        {/* Viewfinder cutout */}
        <View style={styles.viewfinderRow}>
          <View style={styles.sideShade} />
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {loading && (
              <ActivityIndicator size="large" color={colors.white} />
            )}
          </View>
          <View style={styles.sideShade} />
        </View>

        {/* Bottom hint */}
        <View style={styles.bottomShade}>
          <Text style={styles.hint}>
            Point the camera at your driver's QR code
          </Text>
          {scanned && !loading && (
            <TouchableOpacity style={styles.retryBtn} onPress={() => setScanned(false)}>
              <Text style={styles.retryTxt}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const FINDER_SIZE = 240;
const CORNER = 20;
const BORDER = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  permTitle: { ...typography.h2, textAlign: 'center' },
  permSub: { ...typography.body, textAlign: 'center', color: colors.mid },
  permBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  permBtnTxt: { color: colors.white, fontWeight: '700', fontSize: 15 },
  backLink: { marginTop: spacing.sm },
  backLinkTxt: { color: colors.primary, fontWeight: '600' },

  overlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
    gap: spacing.md,
  },
  closeBtn: { padding: 4 },
  topTitle: { color: colors.white, fontSize: 17, fontWeight: '700' },

  viewfinderRow: { flexDirection: 'row', height: FINDER_SIZE },
  sideShade: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  viewfinder: {
    width: FINDER_SIZE,
    height: FINDER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Corner markers
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.white, borderWidth: BORDER },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  bottomShade: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  hint: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center', paddingHorizontal: spacing.xl },
  retryBtn: {
    borderWidth: 1.5,
    borderColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryTxt: { color: colors.white, fontWeight: '700' },
});
