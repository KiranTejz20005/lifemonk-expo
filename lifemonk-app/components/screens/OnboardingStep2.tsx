import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { ClassPill } from '@/components/ui/ClassPill';
import { Input } from '@/components/ui/Input';
import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';

export function OnboardingStep2({
  onComplete,
  onBack,
  onSkip,
}: {
  onComplete: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [selectedClass, setSelectedClass] = useState<string | null>('Class 1');

  const classes = Array.from({ length: 9 }, (_, i) => `Class ${i + 1}`);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color={LifeMonkColors.text} />
        </Pressable>
        <Text style={styles.logo}>Lifemonk</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.subtitle}>Personalize your learning journey ✨</Text>

        <Input label="Your Name" placeholder="What should we call you?" />
        <Input label="School Name" placeholder="Where do you study?" />

        <Text style={styles.label}>Select Your Class</Text>
        <View style={styles.pillRow}>
          {classes.map((cls) => (
            <ClassPill key={cls} label={cls} selected={selectedClass === cls} onPress={() => setSelectedClass(cls)} />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button variant="primary" onPress={onComplete} fullWidth>
          Let's begin! 🚀
        </Button>
        <Pressable onPress={onSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LifeMonkColors.bgApp, paddingHorizontal: LifeMonkSpacing.contentPadding },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: LifeMonkColors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: LifeMonkColors.borderSubtle },
  logo: { fontSize: 20, fontWeight: '800', color: LifeMonkColors.text },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 140, gap: 16 },
  title: { fontSize: 32, fontWeight: '800', color: LifeMonkColors.text, marginBottom: 8 },
  subtitle: { fontSize: 18, fontWeight: '700', color: LifeMonkColors.textMuted, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '800', color: LifeMonkColors.text, letterSpacing: 1, marginTop: 8, marginBottom: 4 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 40, alignItems: 'center', backgroundColor: LifeMonkColors.bgApp },
  skipText: { fontSize: 15, fontWeight: '700', color: LifeMonkColors.textMuted, marginTop: 16 },
});
