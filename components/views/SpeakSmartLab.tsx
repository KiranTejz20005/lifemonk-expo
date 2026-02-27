import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';

const SENTENCES = [
  'The journey of a thousand miles begins with a single step.',
  'Be the change that you wish to see in the world.',
  'To be, or not to be, that is the question.',
  'I think, therefore I am.',
  'That which does not kill us makes us stronger.',
  'Integrity is doing the right thing, even when no one is watching.',
  'Success is not final, failure is not fatal: it is the courage to continue that counts.',
  'The only way to do great work is to love what you do.',
  "Everything you've ever wanted is on the other side of fear.",
  'Hardships often prepare ordinary people for an extraordinary destiny.',
  'It does not matter how slowly you go as long as you do not stop.',
  "Believe you can and you're halfway there.",
  "Your time is limited, so don't waste it living someone else's life.",
  'The best way to predict the future is to invent it.',
  'Do what you can, with what you have, where you are.',
];

const ACCENT_COLOR = '#5D6DFF';

export function SpeakSmartLab({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [transcript, setTranscript] = useState('');

  const sentence = SENTENCES[currentIndex];

  const handleHearExample = () => {
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 1500);
  };

  const startRecording = () => {
    setIsRecording(true);
    setAccuracy(null);
    setTranscript('');
    setTimeout(() => {
      setIsRecording(false);
      setTranscript('Sample transcript');
      setAccuracy(75);
    }, 2000);
  };

  const nextSentence = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % SENTENCES.length);
    setAccuracy(null);
    setTranscript('');
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={LifeMonkColors.text} />
        </Pressable>
        <Text style={styles.title}>Speak Smart Lab</Text>
        <View style={styles.iconBtn}>
          <Ionicons name="moon-outline" size={20} color={LifeMonkColors.text} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.exerciseLabel}>
          <Text style={styles.exerciseNum}>EXERCISE {String(currentIndex + 1).padStart(2, '0')}</Text>
          <Text style={styles.prompt}>Pronounce the following sentence:</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sentenceText}>"{sentence}"</Text>
          <Pressable onPress={handleHearExample} style={[styles.hearBtn, isSpeaking && styles.hearBtnActive]}>
            <Ionicons name="volume-high" size={20} color={isSpeaking ? '#FFF' : ACCENT_COLOR} />
            <Text style={[styles.hearBtnText, isSpeaking && styles.hearBtnTextActive]}>Hear Example</Text>
          </Pressable>
        </View>

        <View style={styles.visualizer}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <View key={i} style={[styles.visualizerBar, { height: isRecording ? [10, 24, 12, 30, 10][i % 5] : 10, opacity: isRecording ? 1 : 0.3 }]} />
          ))}
        </View>

        <Pressable onPress={startRecording} style={[styles.micBtn, isRecording && styles.micBtnActive]}>
          <Ionicons name="mic" size={40} color={isRecording ? '#FFF' : ACCENT_COLOR} />
        </Pressable>

        <Text style={styles.recordLabel}>{isRecording ? 'Recording...' : transcript ? 'Recording Saved' : 'Tap to record'}</Text>
        <Text style={styles.recordHint}>{isRecording ? 'Click to stop' : 'Speak the sentence clearly'}</Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerLabel}>YOUR ACCURACY</Text>
          {accuracy !== null ? (
            <View style={styles.accuracyRow}>
              <Text style={[styles.accuracyValue, accuracy > 80 && styles.accuracyGood, accuracy <= 80 && accuracy > 50 && styles.accuracyMid, accuracy <= 50 && styles.accuracyLow]}>{accuracy}%</Text>
              {accuracy > 80 && <Ionicons name="checkmark-circle" size={18} color="#27AE60" />}
            </View>
          ) : (
            <Text style={styles.accuracyWaiting}>Waiting...</Text>
          )}
        </View>
        <View style={styles.footerBar}>
          <View style={[styles.footerBarFill, { width: `${accuracy ?? 0}%` }]} />
        </View>
        <Pressable onPress={nextSentence} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
          <Ionicons name="arrow-forward" size={16} color={ACCENT_COLOR} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9FF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: LifeMonkSpacing.contentPadding, paddingVertical: 16, backgroundColor: 'rgba(255,255,255,0.5)' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: LifeMonkColors.text },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16, alignItems: 'center' },
  exerciseLabel: { width: '100%', marginBottom: 24 },
  exerciseNum: { fontSize: 11, fontWeight: '800', color: ACCENT_COLOR, letterSpacing: 2, marginBottom: 8 },
  prompt: { fontSize: 28, fontWeight: '800', color: LifeMonkColors.text },
  card: { width: '100%', minHeight: 200, backgroundColor: '#FFF', borderRadius: 40, padding: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  sentenceText: { fontSize: 20, fontWeight: '700', color: LifeMonkColors.text, fontStyle: 'italic', textAlign: 'center', marginBottom: 24 },
  hearBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, backgroundColor: '#EEF1FF' },
  hearBtnActive: { backgroundColor: ACCENT_COLOR },
  hearBtnText: { fontSize: 13, fontWeight: '800', color: ACCENT_COLOR },
  hearBtnTextActive: { color: '#FFF' },
  visualizer: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, marginBottom: 24 },
  visualizerBar: { width: 6, backgroundColor: ACCENT_COLOR, borderRadius: 3 },
  micBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  micBtnActive: { backgroundColor: ACCENT_COLOR },
  recordLabel: { fontSize: 10, fontWeight: '800', color: LifeMonkColors.textMuted, letterSpacing: 1 },
  recordHint: { fontSize: 10, fontWeight: '700', color: '#B0B1B6' },
  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, backgroundColor: '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  footerLeft: {},
  footerLabel: { fontSize: 9, fontWeight: '800', color: LifeMonkColors.textMuted, letterSpacing: 2, marginBottom: 4 },
  accuracyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accuracyValue: { fontSize: 20, fontWeight: '800' },
  accuracyGood: { color: '#27AE60' },
  accuracyMid: { color: '#F39C12' },
  accuracyLow: { color: '#E74C3C' },
  accuracyWaiting: { fontSize: 20, fontWeight: '800', color: '#B0B1B6' },
  footerBar: { flex: 1, height: 6, backgroundColor: 'rgba(0,0,0,0.03)', marginHorizontal: 16, borderRadius: 3, overflow: 'hidden' },
  footerBarFill: { height: '100%', backgroundColor: '#27AE60', borderRadius: 3 },
  skipBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  skipText: { fontSize: 12, fontWeight: '800', color: ACCENT_COLOR },
});
