import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { colors, spacing, radius, typography } from '../../theme';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function ScheduleScreen() {
  const { driver } = useAuth();
  const [slots, setSlots] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [form, setForm] = useState({ startTime: '', endTime: '' });
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSlots = useCallback(async () => {
    if (!driver?.driverCode) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/drivers/${driver.driverCode}/schedule`);
      setSlots(data);
    } catch (err) {
      Alert.alert('Error', 'Could not load schedule');
    } finally {
      setLoading(false);
    }
  }, [driver]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const toggleDay = (i) => setRecurringDays(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i]);

  const addSlot = async () => {
    if (!selectedDate || !form.startTime || !form.endTime) return Alert.alert('Error', 'Fill in all fields');
    setSaving(true);
    try {
      const { data } = await api.post('/drivers/schedule', {
        date: selectedDate,
        startTime: form.startTime,
        endTime: form.endTime,
        isRecurring,
        recurringDays: isRecurring ? JSON.stringify(recurringDays) : null,
      });
      const newSlots = Array.isArray(data) ? data : [data];
      setSlots(s => [...s, ...newSlots]);
      setModalVisible(false);
      setForm({ startTime: '', endTime: '' });
      setIsRecurring(false);
      setRecurringDays([]);
      if (Array.isArray(data)) Alert.alert('Done', `${data.length} slots created`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not save slot');
    } finally {
      setSaving(false);
    }
  };

  const deleteSlot = async (id) => {
    try {
      await api.delete(`/drivers/schedule/${id}`);
      setSlots(s => s.filter(sl => sl.id !== id));
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Cannot delete');
    }
  };

  const markedDates = slots.reduce((acc, s) => {
    acc[s.date] = { marked: true, dotColor: s.isBooked ? colors.danger : colors.success };
    return acc;
  }, {});
  if (selectedDate) markedDates[selectedDate] = { ...(markedDates[selectedDate] || {}), selected: true, selectedColor: colors.primary };

  const upcoming = slots.filter(s => s.date >= new Date().toISOString().split('T')[0]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Schedule</Text>
      <Calendar
        markedDates={markedDates}
        onDayPress={day => { setSelectedDate(day.dateString); setModalVisible(true); }}
        theme={{
          todayTextColor: colors.primary,
          selectedDayBackgroundColor: colors.primary,
          arrowColor: colors.primary,
          dotColor: colors.success,
        }}
      />

      <Text style={styles.sectionTitle}>Upcoming ({upcoming.length})</Text>
      {loading
        ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        : <FlatList
            data={upcoming}
            keyExtractor={i => i.id}
            contentContainerStyle={{ padding: spacing.md }}
            ListEmptyComponent={<Text style={styles.empty}>Tap a date on the calendar to add availability</Text>}
            renderItem={({ item }) => (
              <Card style={styles.slot}>
                <View style={styles.slotRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.slotDate}>{item.date}</Text>
                    <Text style={styles.slotTime}>{item.startTime} – {item.endTime}</Text>
                  </View>
                  {item.isBooked
                    ? <StatusBadge status="confirmed" />
                    : <TouchableOpacity onPress={() => deleteSlot(item.id)}>
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                      </TouchableOpacity>
                  }
                </View>
              </Card>
            )}
          />
      }

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Slot — {selectedDate}</Text>

            <TextInput style={styles.input} placeholder="Start time (e.g. 09:00)" placeholderTextColor={colors.muted} value={form.startTime} onChangeText={v => setForm(f => ({ ...f, startTime: v }))} />
            <TextInput style={styles.input} placeholder="End time (e.g. 11:00)" placeholderTextColor={colors.muted} value={form.endTime} onChangeText={v => setForm(f => ({ ...f, endTime: v }))} />

            <TouchableOpacity style={styles.recurringToggle} onPress={() => setIsRecurring(!isRecurring)}>
              <Ionicons name={isRecurring ? 'checkbox' : 'square-outline'} size={22} color={colors.primary} />
              <Text style={styles.recurringLabel}>Repeat weekly</Text>
            </TouchableOpacity>

            {isRecurring && (
              <View style={styles.daysRow}>
                {DAYS.map((d, i) => (
                  <TouchableOpacity key={i} style={[styles.dayBtn, recurringDays.includes(i) && styles.dayBtnActive]} onPress={() => toggleDay(i)}>
                    <Text style={[styles.dayTxt, recurringDays.includes(i) && styles.dayTxtActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Button label="Save Slot" onPress={addSlot} loading={saving} style={{ marginTop: spacing.md }} />
            <Button label="Cancel" onPress={() => setModalVisible(false)} variant="ghost" style={{ marginTop: spacing.sm }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  title: { ...typography.h1, padding: spacing.lg, paddingTop: 60, backgroundColor: colors.white },
  sectionTitle: { ...typography.label, padding: spacing.md, backgroundColor: colors.surface },
  empty: { textAlign: 'center', color: colors.muted, marginTop: spacing.xl, padding: spacing.lg },
  slot: { marginBottom: spacing.sm },
  slotRow: { flexDirection: 'row', alignItems: 'center' },
  slotDate: { ...typography.label },
  slotTime: { ...typography.body, fontSize: 13, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg },
  modalTitle: { ...typography.h3, marginBottom: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, marginBottom: spacing.sm, fontSize: 15, color: colors.dark, backgroundColor: colors.surface },
  recurringToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.sm },
  recurringLabel: { ...typography.label },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  dayBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dayBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayTxt: { fontWeight: '700', color: colors.muted },
  dayTxtActive: { color: colors.white },
});
