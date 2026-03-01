import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';
import { cnStyle } from '@/utils/cn';

interface ClassPillProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function ClassPill({ label, selected, onPress }: ClassPillProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) =>
        cnStyle(
          styles.pill,
          selected ? styles.pillSelected : styles.pillDefault,
          pressed && styles.pressed
        )
      }
    >
      <Text style={[styles.text, selected ? styles.textSelected : styles.textDefault]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: LifeMonkSpacing.cardRadiusSmall,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillDefault: {
    backgroundColor: LifeMonkColors.bgCard,
    borderColor: LifeMonkColors.borderSubtle,
  },
  pillSelected: {
    backgroundColor: LifeMonkColors.accentPrimary,
    borderColor: LifeMonkColors.accentPrimary,
    shadowColor: LifeMonkColors.accentPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  pressed: { opacity: 0.95 },
  text: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  textDefault: { color: LifeMonkColors.textMuted },
  textSelected: { color: '#FFF' },
});
