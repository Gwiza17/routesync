import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import api from '../../services/api';

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
      <Text style={styles.title}>Find a Driver</Text>
      <Text style={styles.sub}>Enter a Driver ID (e.g. RS-AB1234)</Text>

      <TextInput
        style={styles.input}
        placeholder="Driver ID"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
      />

      <TouchableOpacity style={styles.btn} onPress={search} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Search</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#1a73e8', marginBottom: 6 },
  sub: { color: '#666', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 18, letterSpacing: 2, marginBottom: 16 },
  btn: { backgroundColor: '#1a73e8', borderRadius: 10, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
