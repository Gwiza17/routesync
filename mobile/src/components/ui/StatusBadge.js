import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_COLORS, colors, radius } from '../../theme';

export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || colors.muted;
  const label = status?.replace('_', ' ') || 'unknown';

  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: radius.sm, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});
