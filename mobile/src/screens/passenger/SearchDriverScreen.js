import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';

export default function SearchDriverScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();

  const search = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/drivers/${code.trim().toUpperCase()}`);
      navigation.navigate('DriverProfile', { driver: data });
    } catch {
      Alert.alert('Not Found', 'No driver found with that ID.');
    } finally {
      setLoading(false);
    }
  };

  const confirmLogout = () =>
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.userName}>{user?.name}</Text>
        <TouchableOpacity onPress={confirmLogout} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="log-out-outline" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <Ionicons name="car-sport" size={56} color={colors.primary} />
        <Text style={styles.title}>Find Your Driver</Text>
        <Text style={styles.sub}>Enter the Driver ID shared with you</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputRow}>
          <Ionicons name="search" size={20} color={colors.muted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g. RS-AB1234"
            placeholderTextColor={colors.muted}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            onSubmitEditing={search}
          />
        </View>
        <Button label="Search" onPress={search} loading={loading} size="lg" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, justifyContent: 'center', padding: spacing.lg },
  topBar: {
    position: 'absolute',
    top: 56,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: { ...typography.label, color: colors.mid },
  hero: { alignItems: 'center', marginBottom: spacing.xxl },
  title: { ...typography.h1, marginTop: spacing.md, textAlign: 'center' },
  sub: { ...typography.body, textAlign: 'center', marginTop: spacing.xs },
  form: { gap: spacing.md },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  inputIcon: { marginLeft: spacing.md },
  input: { flex: 1, padding: 14, fontSize: 20, color: colors.dark, letterSpacing: 3, fontWeight: '700' },
});
