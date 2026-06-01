import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Share, Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';

export default function DriverHomeScreen({ navigation }) {
  const { user, driver, logout, updateDriver } = useAuth();

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
        <TouchableOpacity style={styles.shareBtn} onPress={shareDriverId}>
          <Ionicons name="share-social-outline" size={18} color={colors.primary} />
          <Text style={styles.shareTxt}>Share Driver ID</Text>
        </TouchableOpacity>
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

      <Button label="Edit Profile" onPress={openEdit} variant="outline" style={{ marginTop: spacing.md }} />
      <Button label="View Earnings" onPress={() => navigation.navigate('Earnings')} variant="outline" style={{ marginTop: spacing.sm }} />
      <Button label="Log Out" onPress={logout} variant="ghost" style={{ marginTop: spacing.sm }} />

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
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  shareTxt: { color: colors.primary, fontWeight: '700', fontSize: 14 },

  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1, alignItems: 'center', padding: spacing.md, gap: spacing.xs },
  statLabel: { ...typography.caption },
  statValue: { ...typography.label, fontSize: 15 },

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
