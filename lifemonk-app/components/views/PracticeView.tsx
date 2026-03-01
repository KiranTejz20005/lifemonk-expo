import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';
import { MathsMasteryGym } from './MathsMasteryGym';
import { RiddlesAndLogic } from './RiddlesAndLogic';
import { SpeakSmartLab } from './SpeakSmartLab';
import { VocabularyChallenge } from './VocabularyChallenge';

type SubView = 'main' | 'riddles' | 'vocabulary' | 'speak' | 'maths';

const MODULES: { title: string; time: string; xp: string; icon: 'water-outline' | 'timer-outline' | 'bulb-outline' | 'grid-outline' | 'mic-outline' | 'calculator-outline'; color: string; active?: boolean; subView?: SubView }[] = [
  { title: 'Breathing Flow', time: '5 MIN', xp: '+50 XP', icon: 'water-outline', color: '#DBEAFE', active: true },
  { title: 'Focus Training', time: '10 MIN', xp: '+120 XP', icon: 'timer-outline', color: '#FFEDD5' },
  { title: 'Memory Palace', time: '15 MIN', xp: '+200 XP', icon: 'bulb-outline', color: '#F3E8FF', subView: 'vocabulary' },
  { title: 'Logic Puzzles', time: '8 MIN', xp: '+80 XP', icon: 'grid-outline', color: '#D1FAE5', subView: 'riddles' },
  { title: 'Speak Smart Lab', time: '10 MIN', xp: '+100 XP', icon: 'mic-outline', color: '#E0E7FF', subView: 'speak' },
  { title: 'Maths Mastery Gym', time: '12 MIN', xp: '+150 XP', icon: 'calculator-outline', color: '#D1FAE5', subView: 'maths' },
];

function ModuleCard({
  title,
  time,
  xp,
  icon,
  color,
  active,
  onPress,
}: {
  title: string;
  time: string;
  xp: string;
  icon: 'water-outline' | 'timer-outline' | 'bulb-outline' | 'grid-outline' | 'mic-outline' | 'calculator-outline';
  color: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.moduleCard, active && styles.moduleCardActive, pressed && styles.pressed]}>
      <View style={styles.moduleRow}>
        <View style={[styles.moduleIconWrap, { backgroundColor: color }]}>
          <Ionicons name={icon} size={26} color={LifeMonkColors.accentPrimary} />
        </View>
        <View style={styles.moduleText}>
          <Text style={styles.moduleTitle}>{title}</Text>
          <View style={styles.moduleMeta}>
            <Text style={styles.moduleMetaText}>{time}</Text>
            <View style={styles.moduleDot} />
            <Text style={styles.moduleMetaText}>{xp}</Text>
          </View>
        </View>
      </View>
      <View style={[styles.moduleArrow, active && styles.moduleArrowActive]}>
        <Ionicons name="chevron-forward" size={22} color={active ? '#FFF' : LifeMonkColors.text} />
      </View>
    </Pressable>
  );
}

export function PracticeView({ onBack, userName }: { onBack: () => void; userName?: string }) {
  const [subView, setSubView] = useState<SubView>('main');

  if (subView === 'riddles') return <RiddlesAndLogic onBack={() => setSubView('main')} />;
  if (subView === 'vocabulary') return <VocabularyChallenge onBack={() => setSubView('main')} />;
  if (subView === 'speak') return <SpeakSmartLab onBack={() => setSubView('main')} />;
  if (subView === 'maths') return <MathsMasteryGym onBack={() => setSubView('main')} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={LifeMonkColors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{userName ?? 'User'}'s Practice</Text>
          <Text style={styles.headerSub}>LEVEL 4 • 2.4k XP</Text>
        </View>
        <View style={styles.xpBadge}>
          <Ionicons name="flash" size={14} color="#EA580C" />
          <Text style={styles.xpText}>12</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.questCard}
        >
          <Text style={styles.questTitle}>Daily Quest</Text>
          <Text style={styles.questSub}>Complete 3 modules to earn bonus XP</Text>
          <View style={styles.progressBg}>
            <View style={styles.progressFill} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>2/3 Completed</Text>
            <Text style={styles.progressLabel}>+500 XP</Text>
          </View>
        </LinearGradient>

        <View style={styles.modulesList}>
          {MODULES.map((m) => (
            <ModuleCard
              key={m.title}
              title={m.title}
              time={m.time}
              xp={m.xp}
              icon={m.icon}
              color={m.color}
              active={m.active}
              onPress={m.subView ? () => setSubView(m.subView!) : undefined}
            />
          ))}
        </View>
      </ScrollView>
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
    paddingVertical: 20,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: LifeMonkColors.text },
  headerSub: { fontSize: 11, fontWeight: '800', color: LifeMonkColors.accentPrimary, letterSpacing: 2, marginTop: 4 },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  xpText: { fontSize: 12, fontWeight: '800', color: LifeMonkColors.text },
  scroll: { flex: 1 },
  scrollContent: { padding: LifeMonkSpacing.contentPadding, paddingBottom: 100 },
  questCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: LifeMonkSpacing.spacingMd,
  },
  questTitle: { fontSize: 17, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  questSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 16 },
  progressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { width: '66%', height: '100%', backgroundColor: '#FFF', borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressLabel: { fontSize: 11, fontWeight: '800', color: '#FFF' },
  modulesList: { gap: LifeMonkSpacing.spacingMd },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: LifeMonkSpacing.spacingMd,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moduleCardActive: {
    backgroundColor: '#FFF',
    borderColor: LifeMonkColors.accentPrimary,
  },
  pressed: { opacity: 0.98 },
  moduleRow: { flexDirection: 'row', alignItems: 'center', gap: LifeMonkSpacing.spacingMd },
  moduleIconWrap: {
    width: LifeMonkSpacing.touchTarget,
    height: LifeMonkSpacing.touchTarget,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleText: {},
  moduleTitle: { fontSize: 15, fontWeight: '800', color: LifeMonkColors.text },
  moduleMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  moduleMetaText: { fontSize: 11, fontWeight: '800', color: LifeMonkColors.textMuted },
  moduleDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: LifeMonkColors.textMuted },
  moduleArrow: {
    width: LifeMonkSpacing.touchTarget,
    height: LifeMonkSpacing.touchTarget,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleArrowActive: { backgroundColor: LifeMonkColors.accentPrimary },
});
