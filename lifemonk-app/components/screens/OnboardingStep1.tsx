import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { ClassPill } from '@/components/ui/ClassPill';
import { Input } from '@/components/ui/Input';
import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';

export function OnboardingStep1({ onNext, onBack, onSkip }: { onNext: (name: string) => void; onBack: () => void; onSkip: () => void }) {
  const insets = useSafeAreaInsets();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [name, setName] = useState('');
  const classes = Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={LifeMonkColors.text} />
        </Pressable>
        <Text style={styles.logo}>Lifemonk</Text>
        <Pressable onPress={onSkip}><Text style={styles.skipText}>SKIP</Text></Pressable>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Input label="YOUR NAME" placeholder="What should we call you?" value={name} onChangeText={setName} />
        <Input label="SCHOOL NAME" placeholder="Where do you study?" />
        <Text style={styles.label}>SELECT YOUR CLASS</Text>
        <View style={styles.pillRow}>
          {classes.map((cls) => (
            <ClassPill key={cls} label={cls.toUpperCase()} selected={selectedClass === cls} onPress={() => setSelectedClass(cls)} />
          ))}
        </View>
        <View style={styles.twoCol}>
          <View style={styles.twoColItem}><Input label="CITY" placeholder="Your city" /></View>
          <View style={styles.twoColItem}><Input label="STATE" placeholder="Your state" /></View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button variant="primary" onPress={() => onNext(name || 'User')} fullWidth>Let's begin!</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEFAF6', paddingHorizontal: LifeMonkSpacing.contentPadding },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  logo: { fontSize: 24, fontWeight: '800', color: LifeMonkColors.text },
  skipText: { fontSize: 14, fontWeight: '800', color: 'rgba(0,0,0,0.4)' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120, gap: 16 },
  label: { fontSize: 11, fontWeight: '800', color: LifeMonkColors.text, letterSpacing: 2, marginTop: 8, marginBottom: 4 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  twoCol: { flexDirection: 'row', gap: 16 },
  twoColItem: { flex: 1 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 32, backgroundColor: '#FEFAF6' },
});
