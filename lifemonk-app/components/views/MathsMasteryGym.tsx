import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';

interface MathProblem {
  id: number;
  type: 'balance' | 'counting' | 'pattern';
  question: string;
  leftWeight: number;
  rightWeight: number;
  targetVal: number;
  operator: string;
  visualData: { leftLabel?: string; rightLabel?: string; items?: string[] };
}

const PROBLEMS: MathProblem[] = [
  { id: 1, type: 'balance', question: 'Make both sides equal!', leftWeight: 5, rightWeight: 12, targetVal: 7, operator: '+', visualData: { leftLabel: '5', rightLabel: '12' } },
  { id: 2, type: 'counting', question: 'Count the apples!', leftWeight: 0, rightWeight: 0, targetVal: 4, operator: '', visualData: { items: ['🍎', '🍎', '🍎', '🍎'] } },
  { id: 3, type: 'balance', question: 'Balance the scale!', leftWeight: 3, rightWeight: 10, targetVal: 7, operator: '+', visualData: { leftLabel: '3', rightLabel: '10' } },
  { id: 4, type: 'counting', question: 'Count the stars!', leftWeight: 0, rightWeight: 0, targetVal: 6, operator: '', visualData: { items: ['⭐', '⭐', '⭐', '⭐', '⭐', '⭐'] } },
  { id: 5, type: 'balance', question: 'How much more?', leftWeight: 12, rightWeight: 20, targetVal: 8, operator: '+', visualData: { leftLabel: '12', rightLabel: '20' } },
  { id: 6, type: 'counting', question: 'How many balloons?', leftWeight: 0, rightWeight: 0, targetVal: 5, operator: '', visualData: { items: ['🎈', '🎈', '🎈', '🎈', '🎈'] } },
  { id: 7, type: 'balance', question: 'Fill the gap!', leftWeight: 15, rightWeight: 30, targetVal: 15, operator: '+', visualData: { leftLabel: '15', rightLabel: '30' } },
  { id: 8, type: 'counting', question: 'Count the pizzas!', leftWeight: 0, rightWeight: 0, targetVal: 3, operator: '', visualData: { items: ['🍕', '🍕', '🍕'] } },
  { id: 9, type: 'balance', question: 'Balance it!', leftWeight: 4, rightWeight: 18, targetVal: 14, operator: '+', visualData: { leftLabel: '4', rightLabel: '18' } },
  { id: 10, type: 'counting', question: 'How many cats?', leftWeight: 0, rightWeight: 0, targetVal: 7, operator: '', visualData: { items: ['🐱', '🐱', '🐱', '🐱', '🐱', '🐱', '🐱'] } },
  { id: 11, type: 'balance', question: 'Equal weight please!', leftWeight: 20, rightWeight: 45, targetVal: 25, operator: '+', visualData: { leftLabel: '20', rightLabel: '45' } },
  { id: 12, type: 'counting', question: 'Count the bees!', leftWeight: 0, rightWeight: 0, targetVal: 8, operator: '', visualData: { items: ['🐝', '🐝', '🐝', '🐝', '🐝', '🐝', '🐝', '🐝'] } },
  { id: 13, type: 'balance', question: 'Almost there!', leftWeight: 9, rightWeight: 21, targetVal: 12, operator: '+', visualData: { leftLabel: '9', rightLabel: '21' } },
];

const ACCENT_COLOR = '#5D6DFF';

export function MathsMasteryGym({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userValue, setUserValue] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);

  const problem = PROBLEMS[currentIndex];

  const handleCheck = () => {
    const val = parseInt(userValue, 10);
    if (Number.isNaN(val)) return;
    if (val === problem.targetVal) {
      setFeedback('correct');
      setScore((prev) => prev + 1);
      setTimeout(() => {
        setFeedback(null);
        setUserValue('');
        setCurrentIndex((prev) => (prev + 1) % PROBLEMS.length);
      }, 1500);
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={LifeMonkColors.text} />
        </Pressable>
        <Text style={styles.title}>Maths Mastery Gym</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.scoreCard}>
          <View>
            <Text style={styles.scoreLabel}>MASTER LEVEL</Text>
            <Text style={styles.scoreTitle}>Math Genius</Text>
          </View>
          <View style={styles.scoreRight}>
            <View>
              <Text style={styles.scoreLabel}>TOTAL SCORE</Text>
              <Text style={styles.scoreValue}>{score * 10}</Text>
            </View>
            <View style={styles.scoreIcon}>
              <Ionicons name="refresh" size={20} color="#FFF" />
            </View>
          </View>
        </View>

        <View style={styles.problemBadge}>
          <Ionicons name="help-circle" size={16} color="#FF4D6D" />
          <Text style={styles.problemBadgeText}>Problem {currentIndex + 1}</Text>
        </View>
        <Text style={styles.question}>{problem.question}</Text>

        <View style={styles.gameCard}>
          <View style={styles.gameTypeBadge}>
            <Text style={styles.gameTypeText}>
              {problem.type === 'balance' ? 'Solving Equations' : 'Number Game'}
            </Text>
          </View>
          {problem.type === 'balance' ? (
            <View style={styles.balanceRow}>
              <View style={styles.balanceSide}>
                <View style={styles.weightBox}>
                  <Text style={styles.weightText}>{problem.leftWeight}</Text>
                </View>
                {userValue ? (
                  <View style={styles.weightBoxYellow}>
                    <Text style={styles.weightTextYellow}>{userValue}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.balanceCenter} />
              <View style={styles.balanceSide}>
                <View style={styles.weightBoxRight}>
                  <Text style={styles.weightTextRight}>{problem.rightWeight}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.countingRow}>
              {problem.visualData.items?.map((item: string, i: number) => (
                <Text key={i} style={styles.emoji}>{item}</Text>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputRow}>
          {problem.type === 'balance' && (
            <Text style={styles.inputPrefix}>{problem.leftWeight} + </Text>
          )}
          <TextInput
            value={userValue}
            onChangeText={setUserValue}
            placeholder="?"
            keyboardType="number-pad"
            style={styles.input}
            placeholderTextColor={LifeMonkColors.textMuted}
          />
          {problem.type === 'balance' && (
            <Text style={styles.inputSuffix}> = {problem.rightWeight}</Text>
          )}
          {problem.type === 'counting' && problem.visualData.items?.[0] && (
            <Text style={styles.inputSuffix}> {problem.visualData.items[0]}</Text>
          )}
        </View>

        <Pressable
          onPress={handleCheck}
          disabled={!userValue || feedback === 'correct'}
          style={[
            styles.checkBtn,
            !userValue && styles.checkBtnDisabled,
            feedback === 'wrong' && styles.checkBtnWrong,
            feedback === 'correct' && styles.checkBtnCorrect,
          ]}
        >
          {feedback === 'correct' ? (
            <>
              <Ionicons name="checkmark" size={24} color="#FFF" />
              <Text style={styles.checkBtnText}>Perfect!</Text>
            </>
          ) : feedback === 'wrong' ? (
            <>
              <Ionicons name="close" size={24} color="#FFF" />
              <Text style={styles.checkBtnText}>Try Again</Text>
            </>
          ) : (
            <Text style={styles.checkBtnText}>Check Answer</Text>
          )}
        </Pressable>
      </ScrollView>

      {feedback === 'wrong' && (
        <View style={styles.hintBar}>
          <View style={styles.hintIcon}>
            <Ionicons name="help-circle" size={24} color="#111" />
          </View>
          <View style={styles.hintContent}>
            <Text style={styles.hintTitle}>Quick Hint</Text>
            <Text style={styles.hintBody}>
              {problem.type === 'balance'
                ? `Try adding ${problem.targetVal - 1} or ${problem.targetVal + 1} to see if it's closer!`
                : "Count each item carefully, one by one!"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9FF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LifeMonkSpacing.contentPadding,
    paddingVertical: 24,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FAF9FF', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: LifeMonkColors.text },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ACCENT_COLOR,
    padding: 20,
    borderRadius: 32,
    marginBottom: 24,
  },
  scoreLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.6)' },
  scoreTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', fontStyle: 'italic' },
  scoreRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  scoreValue: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  scoreIcon: { width: 40, height: 40, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  problemBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: 'rgba(255,77,109,0.1)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, marginBottom: 12 },
  problemBadgeText: { fontSize: 11, fontWeight: '800', color: '#FF4D6D' },
  question: { fontSize: 26, fontWeight: '800', color: LifeMonkColors.text, marginBottom: 24, textAlign: 'center' },
  gameCard: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    minHeight: 240,
    backgroundColor: '#FFF',
    borderRadius: 40,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  gameTypeBadge: { position: 'absolute', top: 16, alignSelf: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 },
  gameTypeText: { fontSize: 10, fontWeight: '800', color: '#6366f1' },
  balanceRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%', paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: 4, borderBottomColor: 'rgba(52,73,94,0.2)' },
  balanceSide: { flexDirection: 'row', gap: 4, alignItems: 'flex-end' },
  balanceCenter: { width: 16, height: 48, backgroundColor: 'rgba(52,73,94,0.2)', borderRadius: 4 },
  weightBox: { width: 40, height: 40, backgroundColor: ACCENT_COLOR, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  weightText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  weightBoxYellow: { width: 40, height: 40, backgroundColor: '#FFD93D', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  weightTextYellow: { fontSize: 16, fontWeight: '800', color: '#856606' },
  weightBoxRight: { width: 56, height: 56, backgroundColor: '#CBD5E0', borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  weightTextRight: { fontSize: 16, fontWeight: '800', color: '#4A5568' },
  countingRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  emoji: { fontSize: 36 },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#FFF', padding: 20, borderRadius: 32, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  inputPrefix: { fontSize: 24, fontWeight: '800', color: LifeMonkColors.text },
  input: { width: 80, height: 56, backgroundColor: '#f9fafb', borderRadius: 20, borderWidth: 2, borderColor: 'rgba(0,0,0,0.05)', textAlign: 'center', fontSize: 24, fontWeight: '800', color: LifeMonkColors.text },
  inputSuffix: { fontSize: 24, fontWeight: '800', color: LifeMonkColors.text },
  checkBtn: { height: 70, backgroundColor: '#111', borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  checkBtnDisabled: { backgroundColor: '#f3f4f6' },
  checkBtnWrong: { backgroundColor: '#E74C3C' },
  checkBtnCorrect: { backgroundColor: '#27AE60' },
  checkBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  hintBar: { position: 'absolute', bottom: 24, left: 24, right: 24, flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#111', padding: 20, borderRadius: 24 },
  hintIcon: { width: 40, height: 40, backgroundColor: '#FFD93D', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  hintContent: { flex: 1 },
  hintTitle: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  hintBody: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
