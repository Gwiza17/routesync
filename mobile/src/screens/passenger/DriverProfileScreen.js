import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import ScreenHeader from '../../components/ui/ScreenHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';

export default function DriverProfileScreen({ route, navigation }) {
  const { driver } = route.params;
  const [slots, setSlots] = useState([]);
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    api.get(`/drivers/${driver.driverCode}/schedule`)
      .then(r => setSlots(r.data.filter(s => !s.isBooked)))
      .catch(() => Alert.alert('Error', 'Could not load schedule'));

    if (driver.userId) {
      api.get(`/ratings/driver/${driver.userId}`)
        .then(r => setRatings(r.data))
        .catch(() => {});
    }
  }, []);

  const stars = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

  const HomeButton = () => (
    <TouchableOpacity onPress={() => navigation.navigate('PassengerTabs')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <Ionicons name="home-outline" size={24} color={colors.primary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={driver.user?.name}
        subtitle={driver.driverCode}
        onBack={() => navigation.goBack()}
        rightAction={<HomeButton />}
      />
      <ScrollView contentContainerStyle={styles.content}>

        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.h2}>{driver.user?.name}</Text>
              <Text style={{ ...typography.body, color: colors.primary }}>{driver.driverCode}</Text>
              {driver.totalRatings > 0 && (
                <Text style={styles.stars}>{stars(driver.averageRating)} ({driver.totalRatings})</Text>
              )}
            </View>
            <Text style={styles.rate}>${driver.ratePerMile}<Text style={styles.rateUnit}>/mi</Text></Text>
          </View>

          <View style={styles.detailsRow}>
            <Chip icon="car" label={driver.vehicle} />
            <Chip icon="id-card" label={driver.licensePlate} />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Available Slots</Text>
        {slots.length === 0
          ? <Text style={styles.empty}>No available slots right now</Text>
          : slots.map(item => (
            <Card key={item.id} style={styles.slot}>
              <View style={styles.slotRow}>
                <View>
                  <Text style={typography.label}>{item.date}</Text>
                  <Text style={{ ...typography.body, fontSize: 13 }}>{item.startTime} – {item.endTime}</Text>
                </View>
                <Button label="Book" size="sm" onPress={() => navigation.navigate('Booking', { slot: item, driver })} />
              </View>
            </Card>
          ))
        }

        {ratings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {ratings.map(r => (
              <Card key={r.id} style={styles.review}>
                <View style={styles.reviewHeader}>
                  <Text style={typography.label}>{r.reviewer?.name}</Text>
                  <Text style={styles.reviewStars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
                </View>
                {r.comment && <Text style={typography.body}>{r.comment}</Text>}
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const Chip = ({ icon, label }) => label ? (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
    <Ionicons name={icon} size={14} color={colors.muted} />
    <Text style={{ ...typography.caption }}>{label}</Text>
  </View>
) : null;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.md },
  profileCard: { marginBottom: spacing.md },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  rate: { fontSize: 22, fontWeight: '900', color: colors.success },
  rateUnit: { fontSize: 14, fontWeight: '500' },
  stars: { color: colors.warning, marginTop: 2 },
  detailsRow: { flexDirection: 'row', gap: spacing.lg },
  sectionTitle: { ...typography.label, marginTop: spacing.md, marginBottom: spacing.sm },
  empty: { ...typography.body, color: colors.muted, textAlign: 'center', padding: spacing.lg },
  slot: { marginBottom: spacing.sm },
  slotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  review: { marginBottom: spacing.sm },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  reviewStars: { color: colors.warning },
});
