import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '../../theme';

const variants = {
  primary: { bg: colors.primary, text: colors.white },
  success: { bg: colors.success, text: colors.white },
  danger: { bg: colors.danger, text: colors.white },
  outline: { bg: 'transparent', text: colors.primary, border: colors.primary },
  ghost: { bg: 'transparent', text: colors.primary },
};

const sizes = {
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, fontSize: 14 },
  md: { paddingVertical: 14, paddingHorizontal: spacing.lg, fontSize: 15 },
  lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, fontSize: 16 },
};

export default function Button({ label, onPress, variant = 'primary', size = 'md', loading = false, disabled = false, style }) {
  const v = variants[variant];
  const s = sizes[size];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: v.bg, paddingVertical: s.paddingVertical, paddingHorizontal: s.paddingHorizontal },
        v.border && { borderWidth: 1.5, borderColor: v.border },
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={v.text} size="small" />
        : <Text style={[styles.label, { color: v.text, fontSize: s.fontSize }]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
