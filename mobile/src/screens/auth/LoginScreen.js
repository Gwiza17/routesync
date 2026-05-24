import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBlock}>
          <Text style={styles.logo}>RouteSync</Text>
          <Text style={styles.tagline}>Your ride, your schedule.</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button label="Log In" onPress={handleLogin} loading={loading} size="lg" style={{ marginTop: spacing.sm }} />

        <Button
          label="Don't have an account? Sign up"
          onPress={() => navigation.navigate('Register')}
          variant="ghost"
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  inner: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  logoBlock: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: { fontSize: 42, fontWeight: '900', color: colors.primary, letterSpacing: -1 },
  tagline: { ...typography.body, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: spacing.md,
    fontSize: 16,
    color: colors.dark,
    backgroundColor: colors.surface,
  },
});
