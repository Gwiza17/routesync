import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';

export default function DriverHomeScreen({ navigation }) {
  const { user, driver, logout } = useAuth();

  const shareDriverId = async () => {
    await Share.share({ message: `Book a ride with me on RouteSync! My Driver ID is: ${driver?.driverCode}` });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Good day, {user?.name?.split(' ')[0]} 👋</Text>

      <Card style={styles.idCard}>
        <Text style={styles.idLabel}>Your Driver ID</Text>
        <Text style={styles.idCode}>{driver?.driverCode}</Text>
        <Text style={styles.idSub}>Share this with passengers so they can find and book you</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={shareDriverId}>
          <Ionicons name="share-outline" size={18} color={colors.primary} />
          <Text style={styles.shareTxt}>Share Driver ID</Text>
        </TouchableOpacity>
      </Card>

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

      <Button label="View Earnings" onPress={() => navigation.navigate('Earnings')} variant="outline" style={{ marginTop: spacing.md }} />
      <Button label="Log Out" onPress={logout} variant="ghost" style={{ marginTop: spacing.sm }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, paddingTop: 60 },
  greeting: { ...typography.h1, marginBottom: spacing.lg },
  idCard: { backgroundColor: colors.primaryLight, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg, alignItems: 'center' },
  idLabel: { ...typography.caption, color: colors.primary, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  idCode: { fontSize: 40, fontWeight: '900', color: colors.primary, letterSpacing: 4, marginVertical: spacing.sm },
  idSub: { ...typography.caption, textAlign: 'center', color: colors.mid, marginBottom: spacing.md },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  shareTxt: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1, alignItems: 'center', padding: spacing.md, gap: spacing.xs },
  statLabel: { ...typography.caption },
  statValue: { ...typography.label, fontSize: 15 },
});
