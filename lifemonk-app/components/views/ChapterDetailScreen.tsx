import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { LifeMonkColors } from '@/constants/lifemonk-theme';
import type { Course, Chapter, Quiz } from '@/src/services/courses';
import {
  completeChapter,
  fetchQuizByChapter,
  submitQuizAttempt,
} from '@/src/services/courses';

function getYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  if (!u) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ];
  for (const p of patterns) {
    const m = u.match(p);
    if (m) return m[1];
  }
  return null;
}

export function ChapterDetailScreen({
  course,
  chapter,
  onBack,
  onComplete,
}: {
  course: Course;
  chapter: Chapter;
  onBack: () => void;
  onComplete: () => void;
}) {
  const xanoChapterId = chapter.xanoChapterId ?? 0;
  const xanoCourseId = course.xanoCourseId ?? 0;
  const [completing, setCompleting] = useState(false);

  const handleMarkComplete = useCallback(
    async (watchTimeSeconds = 0, quizScore?: number) => {
      if (!xanoChapterId) {
        Alert.alert('Error', 'Chapter not synced to course.');
        return;
      }
      setCompleting(true);
      try {
        await completeChapter(xanoChapterId, watchTimeSeconds, quizScore);
        Alert.alert('Done', 'Chapter marked complete.');
        onComplete();
      } catch (e) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Could not complete chapter');
      } finally {
        setCompleting(false);
      }
    },
    [xanoChapterId, onComplete]
  );

  if (chapter.chapter_type === 'video') {
    return (
      <VideoChapter
        chapter={chapter}
        onBack={onBack}
        onComplete={(watchSec) => handleMarkComplete(watchSec, undefined)}
        completing={completing}
      />
    );
  }
  if (chapter.chapter_type === 'text') {
    return (
      <TextChapter
        chapter={chapter}
        onBack={onBack}
        onComplete={() => handleMarkComplete(0, undefined)}
        completing={completing}
      />
    );
  }
  if (chapter.chapter_type === 'quiz') {
    return (
      <QuizChapter
        course={course}
        chapter={chapter}
        xanoCourseId={xanoCourseId}
        xanoChapterId={xanoChapterId}
        onBack={onBack}
        onComplete={onComplete}
      />
    );
  }
  if (chapter.chapter_type === 'activity') {
    return (
      <ActivityChapter
        chapter={chapter}
        onBack={onBack}
        onComplete={() => handleMarkComplete(0, undefined)}
        completing={completing}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={28} color={LifeMonkColors.text} />
      </Pressable>
      <Text style={styles.title}>{chapter.title}</Text>
      <Text style={styles.unsupported}>Unsupported chapter type.</Text>
    </View>
  );
}

function VideoChapter({
  chapter,
  onBack,
  onComplete,
  completing,
}: {
  chapter: Chapter;
  onBack: () => void;
  onComplete: (watchTimeSeconds: number) => void;
  completing: boolean;
}) {
  const videoId = getYouTubeId(chapter.video_url);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?playsinline=1` : null;
  const requiredSeconds = chapter.duration_minutes
    ? Math.max(1, Math.floor(chapter.duration_minutes * 60 * 0.8))
    : 30;
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(true);

  useEffect(() => {
    if (!timerActive || watchSeconds >= requiredSeconds) return;
    const t = setInterval(() => setWatchSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [timerActive, watchSeconds, requiredSeconds]);

  const canComplete = watchSeconds >= requiredSeconds;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={2}>{chapter.title}</Text>
      </View>
      {embedUrl ? (
        <View style={styles.videoWrap}>
          <WebView
            source={{ uri: embedUrl }}
            style={styles.webview}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
          />
        </View>
      ) : (
        <View style={styles.videoPlaceholder}>
          <Ionicons name="videocam-outline" size={48} color="#9CA3AF" />
          <Text style={styles.placeholderText}>Video not available</Text>
        </View>
      )}
      <View style={styles.footer}>
        {!canComplete && (
          <Text style={styles.watchHint}>
            Watch {requiredSeconds - watchSeconds}s more to unlock Mark Complete
          </Text>
        )}
        <Pressable
          style={[styles.completeBtn, (completing || !canComplete) && styles.completeBtnDisabled]}
          onPress={() => onComplete(watchSeconds)}
          disabled={completing || !canComplete}
        >
          {completing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.completeBtnText}>Mark as Complete</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function TextChapter({
  chapter,
  onBack,
  onComplete,
  completing,
}: {
  chapter: Chapter;
  onBack: () => void;
  onComplete: () => void;
  completing: boolean;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={2}>{chapter.title}</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.bodyText}>{chapter.content || 'No content.'}</Text>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          style={[styles.completeBtn, completing && styles.completeBtnDisabled]}
          onPress={onComplete}
          disabled={completing}
        >
          {completing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.completeBtnText}>Mark as Complete</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function QuizChapter({
  course,
  chapter,
  xanoCourseId,
  xanoChapterId,
  onBack,
  onComplete,
}: {
  course: Course;
  chapter: Chapter;
  xanoCourseId: number;
  xanoChapterId: number;
  onBack: () => void;
  onComplete: () => void;
}) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuizByChapter(chapter.documentId)
      .then((q) => setQuiz(q ?? null))
      .catch(() => setQuiz(null))
      .finally(() => setLoading(false));
  }, [chapter.documentId]);

  const questions = quiz?.questions ?? [];
  const current = questions[index];
  const isLast = index >= questions.length - 1;
  const passScore = quiz?.pass_score ?? 70;

  const handleNext = () => {
    if (selected === null || !current) return;
    const answerText = current.options[selected] ?? '';
    const allAnswersSoFar = [...answers, answerText];
    setAnswers(allAnswersSoFar);
    setSelected(null);
    if (isLast) {
      setSubmitted(true);
      let correctCount = 0;
      questions.forEach((q, i) => {
        const userAns = allAnswersSoFar[i] ?? '';
        const correct = String(q.correct_answer).trim();
        const user = String(userAns).trim();
        if (user === correct) correctCount++;
      });
      const total = questions.length;
      const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
      setScore(percent);

      (async () => {
        setSubmitting(true);
        try {
          const answersPayload = allAnswersSoFar.map((text, i) => ({ question_index: i, selected_answer: text }));
          await submitQuizAttempt(
            xanoChapterId,
            xanoCourseId,
            answersPayload,
            percent,
            total,
            correctCount
          );
          if (percent >= passScore) {
            await completeChapter(xanoChapterId, 0, percent);
          }
        } catch (e) {
          Alert.alert('Error', e instanceof Error ? e.message : 'Failed to submit quiz');
        } finally {
          setSubmitting(false);
        }
      })();
    } else {
      setIndex((i) => i + 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={LifeMonkColors.text} />
        </Pressable>
        <ActivityIndicator style={{ flex: 1 }} />
      </View>
    );
  }

  if (submitted && score !== null) {
    const passed = score >= passScore;
    return (
      <View style={styles.container}>
        <View style={styles.resultWrap}>
          <Text style={styles.resultEmoji}>{passed ? '🎉' : '📝'}</Text>
          <Text style={styles.resultTitle}>{passed ? 'Passed!' : 'Try Again'}</Text>
          <Text style={styles.resultScore}>Score: {score}% (pass: {passScore}%)</Text>
          {!passed && (
            <Text style={styles.resultHint}>Score {passScore}% or more to mark this chapter done.</Text>
          )}
          <Pressable style={styles.resultBtn} onPress={onComplete}>
            <Text style={styles.resultBtnText}>Back to course</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!current) {
    return (
      <View style={styles.container}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={LifeMonkColors.text} />
        </Pressable>
        <Text style={styles.unsupported}>No questions in this quiz.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Quiz</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.questionCount}>Question {index + 1} of {questions.length}</Text>
        <Text style={styles.questionText}>{current.question_text}</Text>
        <View style={styles.optionsWrap}>
          {(current.options || []).map((opt, i) => (
            <Pressable
              key={i}
              style={[styles.optionBtn, selected === i && styles.optionBtnSelected]}
              onPress={() => setSelected(i)}
            >
              <Text style={[styles.optionText, selected === i && styles.optionTextSelected]}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          style={[styles.completeBtn, (selected === null || submitting) && styles.completeBtnDisabled]}
          onPress={handleNext}
          disabled={selected === null || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.completeBtnText}>{isLast ? 'Submit' : 'Next'}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function ActivityChapter({
  chapter,
  onBack,
  onComplete,
  completing,
}: {
  chapter: Chapter;
  onBack: () => void;
  onComplete: () => void;
  completing: boolean;
}) {
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'We need gallery access to upload proof.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProofUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (chapter.activity_requires_proof && !proofUri) {
      Alert.alert('Proof required', 'Please upload proof to complete this activity.');
      return;
    }
    setSubmitting(true);
    try {
      onComplete();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={2}>{chapter.title}</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.bodyText}>{chapter.activity_instructions || 'Complete the activity and submit proof.'}</Text>
        <Pressable style={styles.uploadBtn} onPress={pickImage}>
          <Ionicons name="image-outline" size={24} color={LifeMonkColors.accentPrimary} />
          <Text style={styles.uploadBtnText}>{proofUri ? 'Change image' : 'Upload Proof'}</Text>
        </Pressable>
        {proofUri && <Text style={styles.proofLabel}>Proof attached</Text>}
        <Text style={styles.sectionTitle}>Notes (optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Add notes..."
          placeholderTextColor="#9CA3AF"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          style={[styles.completeBtn, (submitting || completing) && styles.completeBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting || completing}
        >
          {(submitting || completing) ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.completeBtnText}>Submit</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1C252E',
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 120 },
  title: { fontSize: 20, fontWeight: '700', color: LifeMonkColors.text, marginTop: 16 },
  bodyText: { fontSize: 15, color: '#374151', lineHeight: 24 },
  unsupported: { fontSize: 15, color: '#6B7280', marginTop: 16 },
  videoWrap: { height: 220, backgroundColor: '#000' },
  webview: { flex: 1, height: 220 },
  videoPlaceholder: {
    height: 220,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  completeBtn: {
    backgroundColor: LifeMonkColors.accentPrimary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  completeBtnDisabled: { opacity: 0.6 },
  completeBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  watchHint: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 8 },
  questionCount: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  questionText: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 20 },
  optionsWrap: { gap: 12 },
  optionBtn: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  optionBtnSelected: { borderColor: LifeMonkColors.accentPrimary, backgroundColor: '#EEF2FF' },
  optionText: { fontSize: 15, color: '#374151' },
  optionTextSelected: { color: LifeMonkColors.accentPrimary, fontWeight: '600' },
  resultWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  resultEmoji: { fontSize: 64, marginBottom: 16 },
  resultTitle: { fontSize: 24, fontWeight: '800', color: '#111', marginBottom: 8 },
  resultScore: { fontSize: 18, color: '#6B7280', marginBottom: 16 },
  resultHint: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  resultBtn: {
    backgroundColor: LifeMonkColors.accentPrimary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  resultBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 8, marginTop: 16 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  uploadBtnText: { fontSize: 15, fontWeight: '600', color: LifeMonkColors.accentPrimary },
  proofLabel: { fontSize: 13, color: '#22C55E', marginTop: 6 },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111',
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
