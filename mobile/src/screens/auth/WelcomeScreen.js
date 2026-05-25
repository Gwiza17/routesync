import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <Ionicons name="car-sport" size={64} color={colors.primary} />
        </View>
        <Text style={styles.logo}>RouteSync</Text>
        <Text style={styles.tagline}>Book rides on your driver's schedule.{'\n'}No surge pricing. No surprises.</Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="Log In"
          onPress={() => navigation.navigate('Login')}
          size="lg"
        />
        <Button
          label="Create Account"
          onPress={() => navigation.navigate('Register')}
          variant="outline"
          size="lg"
          style={{ marginTop: spacing.md }}
        />
      </View>

      <Text style={styles.footer}>By continuing you agree to our Terms & Privacy Policy</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingTop: 100,
    paddingBottom: 48,
  },
  hero: { alignItems: 'center', gap: spacing.md },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logo: { fontSize: 48, fontWeight: '900', color: colors.primary, letterSpacing: -1 },
  tagline: { ...typography.body, textAlign: 'center', lineHeight: 24, color: colors.mid },
  actions: { width: '100%' },
  footer: { ...typography.caption, textAlign: 'center', color: colors.muted },
});
