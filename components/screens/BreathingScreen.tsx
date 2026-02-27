import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';

type Step = 'In' | 'Hold' | 'Out' | 'Pause';

const STEP_LABELS: Record<Step, string> = {
  In: 'Breathe In',
  Hold: 'Hold',
  Out: 'Breathe Out',
  Pause: 'Rest',
};

export function BreathingScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('In');
  const [counter, setCounter] = useState(4);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setCounter((prev) => {
        if (prev === 1) {
          if (step === 'In') {
            setStep('Hold');
            return 4;
          }
          if (step === 'Hold') {
            setStep('Out');
            return 4;
          }
          if (step === 'Out') {
            setStep('Pause');
            return 4;
          }
          setStep('In');
          return 4;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={28} color={LifeMonkColors.text} />
        </Pressable>
        <Text style={styles.title}>Box Breathing</Text>
        <Pressable onPress={() => setIsMuted(!isMuted)} style={styles.iconBtn}>
          <Ionicons name={isMuted ? 'volume-mute-outline' : 'volume-high-outline'} size={26} color={LifeMonkColors.text} />
        </Pressable>
      </View>

      <View style={styles.center}>
        <Text style={styles.stepLabel}>{STEP_LABELS[step]}</Text>
        <Text style={styles.counter}>{counter}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LifeMonkSpacing.contentPadding,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: LifeMonkColors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 32, fontWeight: '800', color: LifeMonkColors.text, marginBottom: 16 },
  counter: { fontSize: 72, fontWeight: '800', color: LifeMonkColors.accentPrimary },
});
