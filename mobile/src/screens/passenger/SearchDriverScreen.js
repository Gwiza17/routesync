import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';

export default function SearchDriverScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <View style={styles.container}>
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
