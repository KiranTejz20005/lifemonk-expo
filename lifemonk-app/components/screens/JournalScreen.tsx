import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';

interface JournalEntry {
  id: string;
  text: string;
  date: string;
  time: string;
}

export function JournalScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<JournalEntry[]>([]);

  const handleSave = (shouldExit = false) => {
    if (!text.trim()) {
      if (shouldExit) onBack();
      return;
    }
    const now = new Date();
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      text: text.trim(),
      date: now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setHistory((prev) => [newEntry, ...prev]);
    setText('');
    if (shouldExit) onBack();
  };

  const handleDelete = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={LifeMonkColors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Reflection</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={() => setShowHistory(!showHistory)} style={styles.iconBtn}>
            <Ionicons name="time-outline" size={22} color={LifeMonkColors.text} />
          </Pressable>
          <Pressable onPress={() => handleSave(false)} style={styles.saveBtn}>
            <Ionicons name="save-outline" size={22} color={LifeMonkColors.accentPrimary} />
          </Pressable>
        </View>
      </View>

      {showHistory ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.historyContent}>
          {history.map((entry) => (
            <View key={entry.id} style={styles.entry}>
              <Text style={styles.entryText}>{entry.text}</Text>
              <View style={styles.entryMeta}>
                <Text style={styles.entryDate}>{entry.date} · {entry.time}</Text>
                <Pressable onPress={() => handleDelete(entry.id)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.promptCard}>
            <Text style={styles.promptText}>"What's one thing you're grateful for today?"</Text>
          </View>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Start writing your thoughts..."
            placeholderTextColor="rgba(0,0,0,0.2)"
            style={styles.input}
            multiline
          />
          <Pressable onPress={() => handleSave(true)} style={styles.doneBtn}>
            <Text style={styles.doneBtnText}>Save & Close</Text>
          </Pressable>
        </ScrollView>
      )}
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
  headerRight: { flexDirection: 'row', gap: 12 },
  saveBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(110,68,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(110,68,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: LifeMonkSpacing.contentPadding, paddingBottom: 40 },
  promptCard: {
    backgroundColor: LifeMonkColors.accentPrimary,
    borderRadius: 32,
    padding: 28,
    marginBottom: 20,
  },
  promptText: { fontSize: 18, fontWeight: '700', color: '#FFF', fontStyle: 'italic' },
  input: {
    minHeight: 280,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 32,
    padding: 24,
    fontSize: 18,
    fontWeight: '600',
    color: LifeMonkColors.text,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  doneBtn: {
    marginTop: 24,
    paddingVertical: 16,
    backgroundColor: LifeMonkColors.accentPrimary,
    borderRadius: 20,
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  historyContent: { padding: LifeMonkSpacing.contentPadding, paddingBottom: 40 },
  entry: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  entryText: { fontSize: 15, color: LifeMonkColors.text, marginBottom: 8 },
  entryMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryDate: { fontSize: 12, color: LifeMonkColors.textMuted },
});
