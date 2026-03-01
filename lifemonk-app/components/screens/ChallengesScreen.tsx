import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';

interface Challenge {
  id: string;
  text: string;
  completed: boolean;
}

const INITIAL: Challenge[] = [
  { id: '1', text: 'Complete reading 5 book summaries in an hour', completed: false },
  { id: '2', text: 'Be vegan one a day a week', completed: true },
  { id: '3', text: 'Meditate for 20 minutes', completed: false },
];

export function ChallengesScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL);
  const [newChallenge, setNewChallenge] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const addChallenge = () => {
    if (newChallenge.trim()) {
      setChallenges([{ id: Date.now().toString(), text: newChallenge.trim(), completed: false }, ...challenges]);
      setNewChallenge('');
      setShowAdd(false);
    }
  };

  const toggle = (id: string) => {
    setChallenges((prev) => prev.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c)));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={LifeMonkColors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Challenges</Text>
        <Pressable onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Ionicons name="add" size={26} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {challenges.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => toggle(c.id)}
            style={[styles.card, c.completed && styles.cardCompleted]}
          >
            <View style={[styles.check, c.completed && styles.checkCompleted]}>
              {c.completed && <Ionicons name="checkmark" size={20} color="#FFF" />}
            </View>
            <Text style={[styles.cardText, c.completed && styles.cardTextCompleted]}>{c.text}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowAdd(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>New challenge</Text>
            <TextInput
              value={newChallenge}
              onChangeText={setNewChallenge}
              placeholder="Enter challenge..."
              style={styles.modalInput}
              placeholderTextColor={LifeMonkColors.textMuted}
            />
            <Pressable onPress={addChallenge} style={styles.modalSave}>
              <Text style={styles.modalSaveText}>Add</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: LifeMonkColors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: LifeMonkSpacing.contentPadding, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 28,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardCompleted: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderColor: 'rgba(16,185,129,0.2)',
  },
  check: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: LifeMonkColors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCompleted: { backgroundColor: '#10B981', borderColor: '#10B981' },
  cardText: { flex: 1, fontSize: 15, fontWeight: '700', color: LifeMonkColors.text },
  cardTextCompleted: { textDecorationLine: 'line-through', opacity: 0.6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  modalInput: {
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  modalSave: {
    paddingVertical: 16,
    backgroundColor: LifeMonkColors.accentPrimary,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalSaveText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
