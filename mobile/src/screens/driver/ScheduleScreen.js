import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Calendar } from 'react-native-calendars';
import api from '../../services/api';

export default function ScheduleScreen() {
  const [slots, setSlots] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [form, setForm] = useState({ startTime: '', endTime: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/bookings/my');
      // Load driver's own schedule via driver endpoint
    } catch {}
  }, []);

  const loadSlots = useCallback(async () => {
    try {
      const { data: profile } = await api.get('/drivers/profile/me').catch(() => ({ data: null }));
    } catch {}
  }, []);

  const addSlot = async () => {
    if (!selectedDate || !form.startTime || !form.endTime) return Alert.alert('Error', 'Fill in all fields');
    setSaving(true);
    try {
      const { data } = await api.post('/drivers/schedule', {
        date: selectedDate,
        startTime: form.startTime,
        endTime: form.endTime,
      });
      setSlots(s => [...s, data]);
      setModalVisible(false);
      setForm({ startTime: '', endTime: '' });
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
    acc[s.date] = { marked: true, dotColor: s.isBooked ? '#ea4335' : '#34a853' };
    return acc;
  }, {});
  if (selectedDate) markedDates[selectedDate] = { ...(markedDates[selectedDate] || {}), selected: true, selectedColor: '#1a73e8' };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Schedule</Text>
      <Calendar
        markedDates={markedDates}
        onDayPress={day => { setSelectedDate(day.dateString); setModalVisible(true); }}
        theme={{ todayTextColor: '#1a73e8', selectedDayBackgroundColor: '#1a73e8' }}
      />

      <Text style={styles.sectionTitle}>Upcoming Slots</Text>
      <FlatList
        data={slots.filter(s => s.date >= new Date().toISOString().split('T')[0])}
        keyExtractor={i => i.id}
        ListEmptyComponent={<Text style={styles.empty}>Tap a date to add availability</Text>}
        renderItem={({ item }) => (
          <View style={styles.slot}>
            <View style={{ flex: 1 }}>
              <Text style={styles.slotDate}>{item.date}</Text>
              <Text style={styles.slotTime}>{item.startTime} – {item.endTime}</Text>
              {item.isBooked && <Text style={styles.booked}>BOOKED</Text>}
            </View>
            {!item.isBooked && (
              <TouchableOpacity onPress={() => deleteSlot(item.id)}>
                <Text style={styles.delete}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Slot for {selectedDate}</Text>
            <TextInput style={styles.input} placeholder="Start time (e.g. 09:00)" value={form.startTime} onChangeText={v => setForm(f => ({ ...f, startTime: v }))} />
            <TextInput style={styles.input} placeholder="End time (e.g. 11:00)" value={form.endTime} onChangeText={v => setForm(f => ({ ...f, endTime: v }))} />
            <TouchableOpacity style={styles.btn} onPress={addSlot} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Save Slot</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: '800', color: '#222', marginTop: 50, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 10, color: '#333' },
  empty: { color: '#999', textAlign: 'center', marginTop: 20 },
  slot: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#f8f9fa', borderRadius: 10, marginBottom: 8 },
  slotDate: { fontWeight: '700', color: '#222' },
  slotTime: { color: '#555', fontSize: 13 },
  booked: { color: '#ea4335', fontSize: 11, fontWeight: '700', marginTop: 2 },
  delete: { color: '#ea4335', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, color: '#222' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 15 },
  btn: { backgroundColor: '#1a73e8', borderRadius: 10, padding: 14, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '700' },
  cancel: { textAlign: 'center', color: '#ea4335', marginTop: 14, fontWeight: '600' },
});
