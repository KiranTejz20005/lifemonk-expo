import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';

type GoalIcon = 'phone-portrait' | 'globe-outline' | 'flag';

interface Goal {
  id: number;
  title: string;
  progress: number;
  tasks: number;
  completed: number;
  icon: GoalIcon;
  color: string;
}

const ICON_MAP: Record<GoalIcon, keyof typeof Ionicons.glyphMap> = {
  'phone-portrait': 'phone-portrait-outline',
  'globe-outline': 'globe-outline',
  flag: 'flag-outline',
};

export function GoalsScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [goals, setGoals] = useState<Goal[]>([
    { id: 1, title: 'Master React Native', progress: 75, tasks: 12, completed: 9, icon: 'phone-portrait', color: '#3b82f6' },
    { id: 2, title: 'Launch Portfolio', progress: 80, tasks: 5, completed: 4, icon: 'globe-outline', color: LifeMonkColors.accentPrimary },
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newTaskCount, setNewTaskCount] = useState('10');

  const handleAddGoal = () => {
    if (!newGoalTitle.trim()) return;
    const tasks = parseInt(newTaskCount, 10) || 10;
    const newGoal: Goal = {
      id: Date.now(),
      title: newGoalTitle,
      progress: 0,
      tasks,
      completed: 0,
      icon: 'flag',
      color: '#a855f7',
    };
    setGoals([newGoal, ...goals]);
    setNewGoalTitle('');
    setNewTaskCount('10');
    setIsAdding(false);
  };

  const deleteGoal = (id: number) => {
    setGoals(goals.filter((g) => g.id !== id));
  };

  const averageProgress = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length)
    : 0;
  const fullyCompletedGoals = goals.filter((g) => g.progress === 100).length;
  const historicalWins = 12;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color={LifeMonkColors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>My Goals</Text>
        <Pressable onPress={() => setIsAdding(true)} style={styles.addBtn}>
          <Ionicons name="add" size={20} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={20} color="#10b981" style={{ marginBottom: 8 }} />
            <Text style={styles.statValue}>{averageProgress}%</Text>
            <Text style={styles.statLabel}>Consistency</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={20} color="#f97316" style={{ marginBottom: 8 }} />
            <Text style={styles.statValue}>{fullyCompletedGoals + historicalWins}</Text>
            <Text style={styles.statLabel}>Goals Won</Text>
          </View>
        </View>

        {goals.map((goal) => (
          <View key={goal.id} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconWrap, { backgroundColor: `${goal.color}20` }]}>
                <Ionicons name={ICON_MAP[goal.icon]} size={20} color={goal.color} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{goal.title}</Text>
                <Text style={styles.cardMeta}>{goal.completed}/{goal.tasks} Tasks</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.progressText}>{goal.progress}%</Text>
                <Pressable onPress={() => deleteGoal(goal.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </Pressable>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${goal.progress}%` }]} />
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={isAdding} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setIsAdding(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Goal</Text>
              <Pressable onPress={() => setIsAdding(false)}>
                <Ionicons name="close" size={18} color={LifeMonkColors.textMuted} />
              </Pressable>
            </View>
            <TextInput
              value={newGoalTitle}
              onChangeText={setNewGoalTitle}
              placeholder="What's your next target?"
              style={styles.input}
              placeholderTextColor={LifeMonkColors.textMuted}
            />
            <View style={styles.taskRow}>
              <Text style={styles.taskLabel}>Total Tasks:</Text>
              <TextInput
                value={newTaskCount}
                onChangeText={setNewTaskCount}
                keyboardType="number-pad"
                style={styles.taskInput}
                placeholderTextColor={LifeMonkColors.textMuted}
              />
            </View>
            <Pressable onPress={handleAddGoal} style={styles.createBtn}>
              <Text style={styles.createBtnText}>CREATE GOAL</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LifeMonkSpacing.contentPadding,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: LifeMonkColors.text },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: LifeMonkColors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: LifeMonkSpacing.contentPadding, paddingBottom: 40, gap: 16 },
  statsRow: { flexDirection: 'row', gap: 16 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statValue: { fontSize: 24, fontWeight: '800', color: LifeMonkColors.text },
  statLabel: { fontSize: 10, fontWeight: '800', color: LifeMonkColors.textMuted, letterSpacing: 1, marginTop: 4 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: LifeMonkColors.text },
  cardMeta: { fontSize: 10, fontWeight: '700', color: LifeMonkColors.textSecondary, marginTop: 4 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressText: { fontSize: 14, fontWeight: '800', color: LifeMonkColors.accentPrimary },
  deleteBtn: { padding: 8 },
  progressBar: { height: 10, backgroundColor: '#f3f4f6', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: LifeMonkColors.accentPrimary, borderRadius: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(110,68,255,0.2)',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 12, fontWeight: '800', color: LifeMonkColors.text, letterSpacing: 1 },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    color: LifeMonkColors.text,
  },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f9fafb', padding: 16, borderRadius: 16, marginBottom: 16 },
  taskLabel: { fontSize: 12, fontWeight: '800', color: LifeMonkColors.textMuted },
  taskInput: { flex: 1, fontSize: 14, fontWeight: '800', color: LifeMonkColors.text, padding: 0 },
  createBtn: {
    backgroundColor: LifeMonkColors.accentPrimary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  createBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
});
