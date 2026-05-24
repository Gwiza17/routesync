import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [role, setRole] = useState('passenger');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', vehicle: '', licensePlate: '', ratePerMile: '', startAddress: '' });
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) return Alert.alert('Error', 'Name, email and password are required');
    setLoading(true);
    try {
      await register({ ...form, role });
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create Account</Text>

      <Text style={styles.label}>I am a</Text>
      <View style={styles.roleRow}>
        {['passenger', 'driver'].map(r => (
          <TouchableOpacity key={r} style={[styles.roleBtn, role === r && styles.roleBtnActive]} onPress={() => setRole(r)}>
            <Text style={[styles.roleTxt, role === r && styles.roleTxtActive]}>
              {r === 'passenger' ? '🧑 Passenger' : '🚗 Driver'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {[
        { key: 'name', label: 'Full Name' },
        { key: 'email', label: 'Email', autoCapitalize: 'none', keyboardType: 'email-address' },
        { key: 'password', label: 'Password', secure: true },
        { key: 'phone', label: 'Phone Number', keyboardType: 'phone-pad' },
      ].map(f => (
        <View key={f.key}>
          <Text style={styles.fieldLabel}>{f.label}</Text>
          <TextInput
            style={styles.input}
            placeholder={f.label}
            placeholderTextColor={colors.muted}
            value={form[f.key]}
            onChangeText={v => set(f.key, v)}
            secureTextEntry={f.secure}
            autoCapitalize={f.autoCapitalize || 'words'}
            keyboardType={f.keyboardType || 'default'}
          />
        </View>
      ))}

      {role === 'driver' && (
        <>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          {[
            { key: 'vehicle', label: 'Vehicle (e.g. 2022 Toyota Camry)' },
            { key: 'licensePlate', label: 'License Plate' },
            { key: 'ratePerMile', label: 'Rate per Mile ($)', keyboardType: 'decimal-pad' },
            { key: 'startAddress', label: 'Your Start Address' },
          ].map(f => (
            <View key={f.key}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <TextInput
                style={styles.input}
                placeholder={f.label}
                placeholderTextColor={colors.muted}
                value={form[f.key]}
                onChangeText={v => set(f.key, v)}
                keyboardType={f.keyboardType || 'default'}
              />
            </View>
          ))}
        </>
      )}

      <Button label="Create Account" onPress={handleRegister} loading={loading} size="lg" style={{ marginTop: spacing.md }} />
      <Button label="Already have an account? Log in" onPress={() => navigation.navigate('Login')} variant="ghost" style={{ marginTop: spacing.sm }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, backgroundColor: colors.white, flexGrow: 1, paddingTop: 60 },
  title: { ...typography.h1, marginBottom: spacing.lg },
  label: { ...typography.label, marginBottom: spacing.sm },
  roleRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  roleBtn: { flex: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  roleBtnActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  roleTxt: { fontWeight: '600', color: colors.muted },
  roleTxtActive: { color: colors.primary },
  fieldLabel: { ...typography.caption, marginBottom: 4, marginTop: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, fontSize: 15, color: colors.dark, backgroundColor: colors.surface },
  sectionTitle: { ...typography.h3, marginTop: spacing.lg, marginBottom: spacing.sm, color: colors.primary },
});
