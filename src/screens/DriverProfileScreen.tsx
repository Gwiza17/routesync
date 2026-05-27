import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { colors, spacing, radius } from '../theme';

export default function DriverProfileScreen({ route, navigation }: any) {
  const { driver } = route.params;
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('2026-05-23');

  const markedDates = {
    ...driver.availableDates,
    [selectedDate]: { selected: true, selectedColor: colors.purple },
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={[styles.profilePic, { backgroundColor: driver.color + '33' }]}>
            <Text style={styles.profileEmoji}>{driver.emoji}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{driver.name}</Text>
            <Text style={styles.profileSub}>{driver.vehicle} · {driver.location}</Text>
            <View style={styles.idBadge}>
              <Text style={styles.idText}>{driver.id}</Text>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: colors.amber }]}>⭐ {driver.rating}</Text>
            <Text style={styles.statLbl}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{driver.trips.toLocaleString()}</Text>
            <Text style={styles.statLbl}>Trips</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: colors.green }]}>{driver.onTime}%</Text>
            <Text style={styles.statLbl}>On-Time</Text>
          </View>
        </View>

        {/* Rate hero */}
        <View style={styles.rateHero}>
          <View>
            <Text style={styles.rateLbl}>RATE PER MILE</Text>
            <Text style={styles.rateVal}>${driver.ratePerMile.toFixed(2)}</Text>
            <Text style={styles.rateSub}>Includes deadhead + trip miles</Text>
          </View>
          <Text style={styles.rateIcon}>🚗</Text>
        </View>

        {/* Calendar */}
        <View style={styles.calWrap}>
          <Calendar
            current={selectedDate}
            markedDates={markedDates}
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            theme={{
              backgroundColor: colors.bgCard,
              calendarBackground: colors.bgCard,
              textSectionTitleColor: colors.textDim,
              selectedDayBackgroundColor: colors.purple,
              selectedDayTextColor: colors.white,
              todayTextColor: colors.purpleLight,
              dayTextColor: colors.textMuted,
              textDisabledColor: colors.textFaint,
              dotColor: colors.green,
              selectedDotColor: colors.white,
              arrowColor: colors.purple,
              monthTextColor: colors.white,
              indicatorColor: colors.purple,
              textDayFontWeight: '600',
              textMonthFontWeight: '800',
              textDayHeaderFontWeight: '700',
              textDayFontSize: 13,
              textMonthFontSize: 15,
              textDayHeaderFontSize: 11,
            }}
            style={styles.calendar}
          />
          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: 'rgba(52,211,153,0.5)' }]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: 'rgba(239,68,68,0.5)' }]} />
              <Text style={styles.legendText}>Booked</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.purple }]} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
          </View>
        </View>

        {/* Time slots */}
        <View style={styles.slotSection}>
          <Text style={styles.slotTitle}>
            Available Times — {selectedDate.split('-').slice(1).join('/')}
          </Text>
          <View style={styles.slotsWrap}>
            {[...driver.takenSlots.map((s: string) => ({ label: s, taken: true })),
              ...driver.timeSlots.map((s: string) => ({ label: s, taken: false }))]
              .sort((a, b) => {
                const toMins = (t: string) => {
                  const [time, mer] = t.split(' ');
                  let [h, m] = time.split(':').map(Number);
                  if (mer === 'PM' && h !== 12) h += 12;
                  if (mer === 'AM' && h === 12) h = 0;
                  return h * 60 + m;
                };
                return toMins(a.label) - toMins(b.label);
              })
              .map(slot => (
                <TouchableOpacity
                  key={slot.label}
                  style={[
                    styles.slot,
                    slot.taken && styles.slotTaken,
                    selectedSlot === slot.label && !slot.taken && styles.slotSelected,
                  ]}
                  onPress={() => !slot.taken && setSelectedSlot(slot.label)}
                  disabled={slot.taken}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.slotText,
                      slot.taken && styles.slotTextTaken,
                      selectedSlot === slot.label && !slot.taken && styles.slotTextSelected,
                    ]}
                  >
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>

        {/* Book button */}
        <TouchableOpacity
          style={[styles.bookBtn, (!selectedSlot || !driver.available) && styles.bookBtnDisabled]}
          onPress={() =>
            navigation.navigate('Booking', {
              driver,
              date: selectedDate,
              time: selectedSlot,
            })
          }
          disabled={!selectedSlot || !driver.available}
          activeOpacity={0.85}
        >
          <Text style={styles.bookBtnText}>
            {driver.available
              ? selectedSlot
                ? `Book ${selectedSlot} →`
                : 'Select a time slot'
              : 'Driver Unavailable Today'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  backBtn: { paddingHorizontal: spacing.lg, paddingVertical: 10 },
  backText: { color: colors.purple, fontSize: 15, fontWeight: '600' },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  profilePic: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileEmoji: { fontSize: 38 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '800', color: colors.white },
  profileSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  idBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,212,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.25)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  idText: { color: colors.cyan, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 10,
    alignItems: 'center',
  },
  statVal: { fontSize: 16, fontWeight: '800', color: colors.white },
  statLbl: { fontSize: 10, color: colors.textDim, marginTop: 2 },
  rateHero: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(124,58,237,0.3)',
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rateLbl: { fontSize: 11, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.5 },
  rateVal: { fontSize: 30, fontWeight: '900', color: colors.purpleLight },
  rateSub: { fontSize: 11, color: colors.textDim, marginTop: -2 },
  rateIcon: { fontSize: 36 },
  calWrap: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    padding: spacing.sm,
  },
  calendar: { borderRadius: radius.md },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontSize: 10, color: colors.textDim },
  slotSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  slotTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 10 },
  slotsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  slotTaken: { borderColor: colors.bgInput },
  slotSelected: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderColor: colors.purple,
  },
  slotText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  slotTextTaken: { color: colors.textFaint, textDecorationLine: 'line-through' },
  slotTextSelected: { color: colors.purpleLight },
  bookBtn: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.purple,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  bookBtnDisabled: { backgroundColor: colors.bgInput, shadowOpacity: 0 },
  bookBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
