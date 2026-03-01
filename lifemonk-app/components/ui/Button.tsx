import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { LifeMonkColors, LifeMonkSpacing, LifeMonkTypography } from '@/constants/lifemonk-theme';
import { cnStyle } from '@/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'google' | 'phone' | 'ghost';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Button({
  children,
  variant = 'primary',
  fullWidth = true,
  disabled = false,
  onPress,
  style,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) =>
        cnStyle(
          styles.base,
          fullWidth && styles.fullWidth,
          styles.variants[variant],
          pressed && styles.pressed,
          disabled && styles.disabled,
          style
        )
      }
    >
      <Text style={[styles.text, styles.textVariants[variant]]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  pressed: { opacity: 0.98 },
  disabled: { opacity: 0.5 },
  variants: {
    primary: {
      backgroundColor: LifeMonkColors.accentPrimary,
      shadowColor: LifeMonkColors.accentPrimary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    secondary: {
      backgroundColor: LifeMonkColors.bgCard,
      borderWidth: 2,
      borderColor: LifeMonkColors.borderStrong,
    },
    google: {
      backgroundColor: LifeMonkColors.bgCard,
      borderWidth: 1,
      borderColor: LifeMonkColors.borderStrong,
    },
    phone: {
      backgroundColor: LifeMonkColors.accentPrimary,
      shadowColor: LifeMonkColors.accentPrimary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
  },
  text: {
    fontSize: LifeMonkTypography.fontBase,
    fontWeight: '800',
  },
  textVariants: {
    primary: { color: '#FFF' },
    secondary: { color: LifeMonkColors.text },
    google: { color: LifeMonkColors.text },
    phone: { color: '#FFF' },
    ghost: { color: LifeMonkColors.textMuted },
  },
});
