import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { colors, spacing, typography, radius } from '../../theme';

export default function AccountScreen() {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Account</Text>

      <View style={styles.avatar}>
        <Ionicons name="person-circle" size={72} color={colors.primary} />
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Passenger</Text>
        </View>
      </View>

      <Card style={styles.section}>
        <Row icon="mail-outline" label="Email" value={user?.email} />
        <Row icon="person-outline" label="Role" value="Passenger" />
      </Card>

      <Button
        label="Log Out"
        onPress={logout}
        variant="danger"
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
  );
}

const Row = ({ icon, label, value }) => (
  <View style={styles.row}>
    <Ionicons name={icon} size={18} color={colors.muted} />
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, paddingTop: 60 },
  title: { ...typography.h1, marginBottom: spacing.lg },
  avatar: { alignItems: 'center', marginBottom: spacing.lg, gap: spacing.xs },
  name: { ...typography.h2, marginTop: spacing.sm },
  email: { ...typography.body, color: colors.muted },
  roleBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  roleText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  section: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.surface },
  rowLabel: { ...typography.caption, color: colors.muted },
  rowValue: { ...typography.body, fontWeight: '500' },
});
