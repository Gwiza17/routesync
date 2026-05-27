import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { colors, spacing, radius } from '../theme';

const { height } = Dimensions.get('window');

export default function SplashScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>🗺</Text>
        </View>

        <Text style={styles.title}>RouteSync</Text>
        <Text style={styles.subtitle}>
          Book your trusted driver.{'\n'}Know your route. Own your schedule.
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Feature list */}
        <View style={styles.features}>
          {[
            '✔  Schedule trips in advance',
            '✔  Transparent mileage-based pricing',
            '✔  Live GPS turn-by-turn guidance',
          ].map(f => (
            <Text key={f} style={styles.feature}>{f}</Text>
          ))}
        </View>

        {/* CTAs */}
        <View style={styles.btnGroup}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>Get Started as Passenger</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnSecondaryText}>Sign Up as a Driver</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          By continuing you agree to the{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  logoEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  divider: {
    width: 40,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.purple,
    marginBottom: spacing.lg,
  },
  features: {
    gap: 8,
    marginBottom: spacing.xl,
    alignSelf: 'stretch',
    paddingHorizontal: spacing.lg,
  },
  feature: {
    fontSize: 14,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 22,
  },
  btnGroup: {
    alignSelf: 'stretch',
    gap: 10,
    marginBottom: spacing.md,
  },
  btnPrimary: {
    backgroundColor: colors.purple,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  btnPrimaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  btnSecondary: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  terms: {
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: colors.purple,
  },
});
