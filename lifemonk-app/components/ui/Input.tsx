import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { LifeMonkColors, LifeMonkSpacing, LifeMonkTypography } from '@/constants/lifemonk-theme';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
}

export function Input({ label, icon, style, ...props }: InputProps) {
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
      <View style={styles.inputWrap}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <TextInput
          style={[
            styles.input,
            icon ? styles.inputWithIcon : undefined,
            style,
          ]}
          placeholderTextColor={LifeMonkColors.textMuted}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 8,
  },
  label: {
    fontSize: LifeMonkTypography.fontSm,
    fontWeight: '800',
    color: LifeMonkColors.text,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    width: '100%',
    height: 60,
    backgroundColor: LifeMonkColors.bgCard,
    borderWidth: 2,
    borderColor: LifeMonkColors.borderSubtle,
    borderRadius: 20,
    paddingHorizontal: 24,
    fontSize: 16,
    fontWeight: '700',
    color: LifeMonkColors.text,
  },
  inputWithIcon: {
    paddingLeft: 48,
  },
});
