import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [role, setRole] = useState('passenger');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', vehicle: '', licensePlate: '', ratePerMile: '', startAddress: '' });
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <View style={styles.roleRow}>
        {['passenger', 'driver'].map(r => (
          <TouchableOpacity key={r} style={[styles.roleBtn, role === r && styles.roleBtnActive]} onPress={() => setRole(r)}>
            <Text style={[styles.roleTxt, role === r && styles.roleTxtActive]}>{r.charAt(0).toUpperCase() + r.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {['name', 'email', 'password', 'phone'].map(field => (
        <TextInput key={field} style={styles.input} placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
          value={form[field]} onChangeText={v => set(field, v)}
          secureTextEntry={field === 'password'} autoCapitalize="none" />
      ))}

      {role === 'driver' && (
        <>
          <TextInput style={styles.input} placeholder="Vehicle (e.g. 2022 Toyota Camry)" value={form.vehicle} onChangeText={v => set('vehicle', v)} />
          <TextInput style={styles.input} placeholder="License Plate" value={form.licensePlate} onChangeText={v => set('licensePlate', v)} />
          <TextInput style={styles.input} placeholder="Rate per Mile ($)" value={form.ratePerMile} onChangeText={v => set('ratePerMile', v)} keyboardType="decimal-pad" />
          <TextInput style={styles.input} placeholder="Your Start Address" value={form.startAddress} onChangeText={v => set('startAddress', v)} />
        </>
      )}

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#1a73e8', marginBottom: 24, textAlign: 'center' },
  roleRow: { flexDirection: 'row', marginBottom: 20, gap: 12 },
  roleBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#1a73e8', borderColor: '#1a73e8' },
  roleTxt: { color: '#666', fontWeight: '600' },
  roleTxtActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 15 },
  btn: { backgroundColor: '#1a73e8', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', color: '#1a73e8', marginTop: 16, fontSize: 14 },
});
