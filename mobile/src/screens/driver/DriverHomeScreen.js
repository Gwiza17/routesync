import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function DriverHomeScreen({ navigation }) {
  const { user, driver, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Welcome, {user?.name}</Text>
      <View style={styles.codeBox}>
        <Text style={styles.codeLabel}>Your Driver ID</Text>
        <Text style={styles.code}>{driver?.driverCode}</Text>
        <Text style={styles.codeSub}>Share this with passengers to let them find and book you</Text>
      </View>
      <View style={styles.rateBox}>
        <Text style={styles.rateLabel}>Rate per mile</Text>
        <Text style={styles.rate}>${driver?.ratePerMile}</Text>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutTxt}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center' },
  greeting: { fontSize: 24, fontWeight: '800', color: '#222', marginBottom: 32 },
  codeBox: { backgroundColor: '#e8f0fe', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  codeLabel: { color: '#1a73e8', fontWeight: '600', marginBottom: 8 },
  code: { fontSize: 36, fontWeight: '900', color: '#1a73e8', letterSpacing: 4 },
  codeSub: { color: '#555', textAlign: 'center', marginTop: 8, fontSize: 13 },
  rateBox: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 32 },
  rateLabel: { color: '#666' },
  rate: { fontSize: 28, fontWeight: '900', color: '#34a853' },
  logoutBtn: { padding: 14, alignItems: 'center' },
  logoutTxt: { color: '#ea4335', fontWeight: '700' },
});
