import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadows } from '../../theme';

export default function Card({ children, style, padding = spacing.md }) {
  return (
    <View style={[styles.card, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    ...shadows.card,
  },
});
