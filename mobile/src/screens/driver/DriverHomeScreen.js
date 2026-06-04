import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Share, Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';

export default function DriverHomeScreen({ navigation }) {
  const { user, driver, logout, updateDriver } = useAuth();

  // ── Platform mode ────────────────────────────────────────────────────────
  const [mode, setMode]         = useState(driver?.mode || 'private');
  const [modeLoading, setModeLoading] = useState(false);
  const [passengers, setPassengers]   = useState([]);
  const [passLoading, setPassLoading] = useState(false);

  const loadPassengers = useCallback(async () => {
    if (mode !== 'private') return;
    setPassLoading(true);
    try {
      const { data } = await api.get('/drivers/passengers');
      setPassengers(data);
    } catch {}
    finally { setPassLoading(false); }
  }, [mode]);

  useEffect(() => { loadPassengers(); }, [loadPassengers]);

  const toggleMode = async (newMode) => {
    if (newMode === mode) return;
    setModeLoading(true);
    try {
      const { data } = await api.put('/drivers/profile', { mode: newMode });
      await updateDriver(data);
      setMode(newMode);
      if (newMode === 'private') loadPassengers();
    } catch {
      Alert.alert('Error', 'Could not update mode');
    } finally {
      setModeLoading(false);
    }
  };

  const removePassenger = async (passengerId) => {
    try {
      await api.delete(`/drivers/passengers/${passengerId}`);
      setPassengers(p => p.filter(x => x.passenger?.id !== passengerId));
    } catch {
      Alert.alert('Error', 'Could not remove passenger');
    }
  };

  // ── QR Code modal ────────────────────────────────────────────────────────
  const [qrVisible, setQrVisible] = useState(false);

  // ── Edit Profile modal ───────────────────────────────────────────────────
  const [editVisible, setEditVisible] = useState(false);
  const [form, setForm] = useState({
    vehicle: driver?.vehicle || '',
    licensePlate: driver?.licensePlate || '',
    ratePerMile: driver?.ratePerMile?.toString() || '',
    startAddress: driver?.startAddress || '',
  });
  const [saving, setSaving] = useState(false);

  const openEdit = () => {
    setForm({
      vehicle: driver?.vehicle || '',
      licensePlate: driver?.licensePlate || '',
      ratePerMile: driver?.ratePerMile?.toString() || '',
      startAddress: driver?.startAddress || '',
    });
    setEditVisible(true);
  };

  const saveProfile = async () => {
    const rate = parseFloat(form.ratePerMile);
    if (isNaN(rate) || rate <= 0) {
      return Alert.alert('Invalid rate', 'Rate per mile must be a positive number');
    }
    setSaving(true);
    try {
      const { data } = await api.put('/drivers/profile', {
        vehicle: form.vehicle.trim(),
        licensePlate: form.licensePlate.trim(),
        ratePerMile: rate,
        startAddress: form.startAddress.trim(),
      });
      await updateDriver(data);
      setEditVisible(false);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  // ── Share Driver ID ──────────────────────────────────────────────────────
  const shareDriverId = async () => {
    try {
      await Share.share(
        {
          title: 'Book a ride with me on RouteSync',
          message: `Book a ride with me on RouteSync!\nMy Driver ID is: ${driver?.driverCode}\n\nSearch for my ID in the RouteSync app to view my schedule and book.`,
        },
        { dialogTitle: 'Share your Driver ID' },
      );
    } catch (err) {
      Alert.alert('Error', 'Could not open share sheet');
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Good day, {user?.name?.split(' ')[0]} 👋</Text>

      {/* Driver ID card */}
      <Card style={styles.idCard}>
        <Text style={styles.idLabel}>Your Driver ID</Text>
        <Text style={styles.idCode}>{driver?.driverCode}</Text>
        <Text style={styles.idSub}>Share this with passengers so they can find and book you</Text>
        <View style={styles.idActions}>
          <TouchableOpacity style={styles.idActionBtn} onPress={() => setQrVisible(true)}>
            <Ionicons name="qr-code-outline" size={18} color={colors.primary} />
            <Text style={styles.idActionTxt}>Show QR</Text>
          </TouchableOpacity>
          <View style={styles.idDivider} />
          <TouchableOpacity style={styles.idActionBtn} onPress={shareDriverId}>
            <Ionicons name="share-social-outline" size={18} color={colors.primary} />
            <Text style={styles.idActionTxt}>Share</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Ionicons name="car-outline" size={24} color={colors.primary} />
          <Text style={styles.statLabel}>Vehicle</Text>
          <Text style={styles.statValue} numberOfLines={1}>{driver?.vehicle || '—'}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="cash-outline" size={24} color={colors.success} />
          <Text style={styles.statLabel}>Rate</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>${driver?.ratePerMile}/mi</Text>
        </Card>
      </View>

      {/* ── Platform Mode ──────────────────────────────────────────────── */}
      <View style={styles.modeSection}>
        <Text style={styles.modeTitle}>Platform Mode</Text>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'private' && styles.modeBtnActive]}
            onPress={() => toggleMode('private')}
            disabled={modeLoading}
          >
            <Ionicons name="lock-closed" size={15} color={mode === 'private' ? colors.white : colors.muted} />
            <Text style={[styles.modeTxt, mode === 'private' && styles.modeTxtActive]}>Private</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'pool' && styles.modeBtnPool]}
            onPress={() => toggleMode('pool')}
            disabled={modeLoading}
          >
            <Ionicons name="globe-outline" size={15} color={mode === 'pool' ? colors.white : colors.muted} />
            <Text style={[styles.modeTxt, mode === 'pool' && styles.modeTxtActive]}>Pool</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.modeDesc}>
          {mode === 'private'
            ? '🔒 Only your linked passengers can book you. Share your QR code to add clients.'
            : '🌐 You appear in Browse Available. Any registered passenger can book you.'}
        </Text>

        {/* Private mode — My Clients list */}
        {mode === 'private' && (
          <View style={styles.clientsSection}>
            <View style={styles.clientsHeader}>
              <Text style={styles.clientsTitle}>My Clients ({passengers.length})</Text>
              {passLoading && <ActivityIndicator size="small" color={colors.primary} />}
            </View>
            {passengers.length === 0 && !passLoading
              ? <Text style={styles.clientsEmpty}>No clients yet. Share your QR code to get started.</Text>
              : passengers.map(link => (
                <View key={link.id} style={styles.clientRow}>
                  <View style={styles.clientAvatar}>
                    <Ionicons name="person" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clientName}>{link.passenger?.name}</Text>
                    <Text style={styles.clientEmail}>{link.passenger?.email}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removePassenger(link.passenger?.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={22} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))
            }
          </View>
        )}
      </View>

      <Button label="Edit Profile" onPress={openEdit} variant="outline" style={{ marginTop: spacing.md }} />
      <Button label="Messages" onPress={() => navigation.navigate('ChatsList')} variant="outline" style={{ marginTop: spacing.sm }} />
      <Button label="View Earnings" onPress={() => navigation.navigate('Earnings')} variant="outline" style={{ marginTop: spacing.sm }} />
      <Button label="Log Out" onPress={logout} variant="ghost" style={{ marginTop: spacing.sm }} />

      {/* ── QR Code Modal ──────────────────────────────────────────────── */}
      <Modal visible={qrVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.qrOverlay} activeOpacity={1} onPress={() => setQrVisible(false)}>
          <View style={styles.qrBox}>
            <Text style={styles.qrTitle}>Your Driver QR Code</Text>
            <Text style={styles.qrSub}>Passengers scan this to add you as their default driver</Text>
            <View style={styles.qrWrapper}>
              <QRCode value={driver?.driverCode || 'ROUTESYNC'} size={200} />
            </View>
            <Text style={styles.qrCode}>{driver?.driverCode}</Text>
            <TouchableOpacity style={styles.qrCloseBtn} onPress={() => setQrVisible(false)}>
              <Text style={styles.qrCloseTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Edit Profile Modal ─────────────────────────────────────────── */}
      <Modal visible={editVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Edit Profile</Text>

              <Text style={styles.fieldLabel}>Vehicle (make, model, year)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Toyota Camry 2023"
                placeholderTextColor={colors.muted}
                value={form.vehicle}
                onChangeText={v => setForm(f => ({ ...f, vehicle: v }))}
              />

              <Text style={styles.fieldLabel}>License Plate</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. ABC 1234"
                placeholderTextColor={colors.muted}
                value={form.licensePlate}
                onChangeText={v => setForm(f => ({ ...f, licensePlate: v }))}
                autoCapitalize="characters"
              />

              <Text style={styles.fieldLabel}>Rate per Mile ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1.85"
                placeholderTextColor={colors.muted}
                value={form.ratePerMile}
                onChangeText={v => setForm(f => ({ ...f, ratePerMile: v }))}
                keyboardType="decimal-pad"
              />

              <Text style={styles.fieldLabel}>Starting Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Your home / base location"
                placeholderTextColor={colors.muted}
                value={form.startAddress}
                onChangeText={v => setForm(f => ({ ...f, startAddress: v }))}
              />

              <Button label="Save Changes" onPress={saveProfile} loading={saving} style={{ marginTop: spacing.md }} />
              <Button label="Cancel" onPress={() => setEditVisible(false)} variant="ghost" style={{ marginTop: spacing.sm }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, paddingTop: 60 },
  greeting: { ...typography.h1, marginBottom: spacing.lg },

  idCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  idLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  idCode: { fontSize: 40, fontWeight: '900', color: colors.primary, letterSpacing: 4, marginVertical: spacing.sm },
  idSub: { ...typography.caption, textAlign: 'center', color: colors.mid, marginBottom: spacing.md },
  idActions: { flexDirection: 'row', alignItems: 'center' },
  idActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.xs },
  idActionTxt: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  idDivider: { width: 1, height: 20, backgroundColor: colors.border },

  // QR Modal
  qrOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  qrBox: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    width: '85%',
  },
  qrTitle: { ...typography.h2, marginBottom: spacing.xs, textAlign: 'center' },
  qrSub: { ...typography.caption, textAlign: 'center', color: colors.mid, marginBottom: spacing.lg },
  qrWrapper: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  qrCode: { fontSize: 24, fontWeight: '900', color: colors.primary, letterSpacing: 3, marginBottom: spacing.lg },
  qrCloseBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  qrCloseTxt: { fontWeight: '700', color: colors.dark },

  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1, alignItems: 'center', padding: spacing.md, gap: spacing.xs },
  statLabel: { ...typography.caption },
  statValue: { ...typography.label, fontSize: 15 },

  // Mode toggle
  modeSection: { marginTop: spacing.lg, backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md },
  modeTitle: { ...typography.label, color: colors.muted, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 },
  modeToggle: { flexDirection: 'row', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.sm },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: 10, backgroundColor: colors.white },
  modeBtnActive: { backgroundColor: colors.dark },
  modeBtnPool: { backgroundColor: colors.success },
  modeTxt: { fontSize: 13, fontWeight: '700', color: colors.muted },
  modeTxtActive: { color: colors.white },
  modeDesc: { ...typography.caption, color: colors.mid, lineHeight: 18 },
  clientsSection: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  clientsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  clientsTitle: { ...typography.label },
  clientsEmpty: { ...typography.caption, color: colors.muted, textAlign: 'center', paddingVertical: spacing.md },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.surface },
  clientAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  clientName: { ...typography.label, fontSize: 14 },
  clientEmail: { ...typography.caption },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalTitle: { ...typography.h3, marginBottom: spacing.md },
  fieldLabel: { ...typography.caption, color: colors.muted, marginBottom: 4, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 15,
    color: colors.dark,
    backgroundColor: colors.surface,
  },
});
