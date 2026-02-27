import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';

export function FocusScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let t: ReturnType<typeof setInterval> | null = null;
    if (isActive) {
      t = setInterval(() => {
        setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
        if (timeLeft <= 1) setIsActive(false);
      }, 1000);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const reset = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={LifeMonkColors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Focus</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.center}>
        <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
        <View style={styles.buttons}>
          <Pressable onPress={() => setIsActive(!isActive)} style={styles.mainBtn}>
            <Text style={styles.mainBtnText}>{isActive ? 'PAUSE' : 'START'}</Text>
          </Pressable>
          <Pressable onPress={reset} style={styles.secondaryBtn}>
            <Ionicons name="refresh-outline" size={22} color={LifeMonkColors.text} />
            <Text style={styles.secondaryBtnText}>Reset</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(255,255,255,0.95)' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LifeMonkSpacing.contentPadding,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: LifeMonkColors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  timer: { fontSize: 64, fontWeight: '800', color: LifeMonkColors.text, marginBottom: 32 },
  buttons: { flexDirection: 'row', gap: 16 },
  mainBtn: {
    paddingHorizontal: 40,
    paddingVertical: 18,
    backgroundColor: LifeMonkColors.accentPrimary,
    borderRadius: 24,
  },
  mainBtnText: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '700', color: LifeMonkColors.text },
});
