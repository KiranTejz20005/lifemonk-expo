import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';

const PUZZLES = [
  { id: 1, question: 'I have a tail and a head, but no body. What am I?', options: ['Dog', 'Coin', 'Kite'], answer: 'Coin' },
  { id: 2, question: 'The more of this there is, the less you see. What is it?', options: ['Fog', 'Darkness', 'Sunglasses'], answer: 'Darkness' },
  { id: 3, question: 'What building has the most stories?', options: ['Skyscraper', 'Library', 'Hospital'], answer: 'Library' },
];

export function RiddlesAndLogic({ onBack }: { onBack: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const puzzle = PUZZLES[currentIndex];
  const isCorrect = selected === puzzle?.answer;

  const handleOption = (opt: string) => {
    setSelected(opt);
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < PUZZLES.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      onBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={LifeMonkColors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Logic Puzzles</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {puzzle && (
          <>
            <Text style={styles.question}>{puzzle.question}</Text>
            <View style={styles.options}>
              {puzzle.options.map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => !showResult && handleOption(opt)}
                  style={[
                    styles.option,
                    selected === opt && (opt === puzzle.answer ? styles.optionCorrect : styles.optionWrong),
                    showResult && opt === puzzle.answer && styles.optionCorrect,
                  ]}
                >
                  <Text style={styles.optionText}>{opt}</Text>
                </Pressable>
              ))}
            </View>
            {showResult && (
              <View style={styles.resultWrap}>
                <Text style={styles.resultText}>{isCorrect ? 'Correct!' : `Answer: ${puzzle.answer}`}</Text>
                <Pressable onPress={handleNext} style={styles.nextBtn}>
                  <Text style={styles.nextBtnText}>{currentIndex < PUZZLES.length - 1 ? 'Next' : 'Done'}</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LifeMonkSpacing.contentPadding,
    paddingVertical: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: LifeMonkColors.text },
  placeholder: { width: 44 },
  content: { padding: LifeMonkSpacing.contentPadding, paddingTop: 32 },
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: LifeMonkColors.text,
    marginBottom: 24,
  },
  options: { gap: 12 },
  option: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCorrect: { backgroundColor: '#D1FAE5', borderColor: '#10B981' },
  optionWrong: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  optionText: { fontSize: 16, fontWeight: '600', color: LifeMonkColors.text },
  resultWrap: { marginTop: 24, alignItems: 'center' },
  resultText: { fontSize: 18, fontWeight: '800', color: LifeMonkColors.accentPrimary, marginBottom: 16 },
  nextBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: LifeMonkColors.accentPrimary,
    borderRadius: 14,
  },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});
