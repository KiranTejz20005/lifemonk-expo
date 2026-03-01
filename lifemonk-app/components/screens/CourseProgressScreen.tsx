import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LifeMonkColors } from '@/constants/lifemonk-theme';
import {
  getCourseProgress,
  issueCertificate,
  type Course,
  type XanoCourseProgress,
} from '@/src/services/courses';

export interface CourseProgressScreenProps {
  course: Course;
  onBack: () => void;
  onClaimCertificate?: (course: Course, date: string) => void;
}

function ProgressRing({ percent }: { percent: number }) {
  return (
    <View style={styles.ringWrapInner}>
      <Text style={styles.ringPercentBig}>{percent}%</Text>
      <Text style={styles.ringLabel}>Complete</Text>
      <View style={styles.ringBarBg}>
        <View style={[styles.ringBarFill, { width: `${Math.min(100, percent)}%` }]} />
      </View>
    </View>
  );
}

export function CourseProgressScreen({
  course,
  onBack,
  onClaimCertificate,
}: CourseProgressScreenProps) {
  const xanoCourseId = course.xanoCourseId ?? 0;
  const [progress, setProgress] = useState<XanoCourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const load = useCallback(async () => {
    if (!xanoCourseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const p = await getCourseProgress(xanoCourseId);
      setProgress(p ?? null);
    } catch {
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, [xanoCourseId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClaimCertificate = async () => {
    if (!xanoCourseId || claiming || !progress || progress.progress_percent < 100) return;
    setClaiming(true);
    try {
      await issueCertificate(xanoCourseId);
      const date = new Date().toLocaleDateString();
      onClaimCertificate?.(course, date);
      load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not issue certificate');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={LifeMonkColors.text} />
        </Pressable>
        <ActivityIndicator style={styles.loader} size="large" />
      </View>
    );
  }

  const percent = progress?.progress_percent ?? 0;
  const chapters = progress?.chapters ?? [];
  const completedCount = chapters.filter((c) => c.completed).length;
  const totalCount = chapters.length;
  const avgQuizScore =
    chapters.filter((c) => c.quiz_score != null).length > 0
      ? Math.round(
          chapters
            .filter((c) => c.quiz_score != null)
            .reduce((a, c) => a + (c.quiz_score ?? 0), 0) /
            chapters.filter((c) => c.quiz_score != null).length
        )
      : null;
  const totalWatchSeconds = chapters.reduce((a, c) => a + (c.watch_time_seconds ?? 0), 0);
  const certificateIssued = progress?.certificate_issued ?? false;
  const canClaimCertificate =
    percent >= 100 && !certificateIssued && totalCount > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={LifeMonkColors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Course Progress</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {course.title}
        </Text>

        <View style={styles.ringWrap}>
          <ProgressRing percent={percent} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{completedCount}/{totalCount}</Text>
            <Text style={styles.statLabel}>Chapters</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {totalWatchSeconds >= 3600
                ? `${Math.floor(totalWatchSeconds / 3600)}h ${Math.floor((totalWatchSeconds % 3600) / 60)}m`
                : `${Math.floor(totalWatchSeconds / 60)} min`}
            </Text>
            <Text style={styles.statLabel}>Time spent</Text>
          </View>
          {avgQuizScore != null && (
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{avgQuizScore}%</Text>
              <Text style={styles.statLabel}>Avg quiz</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Chapter breakdown</Text>
        {chapters.length === 0 ? (
          <Text style={styles.emptyText}>No chapter data yet.</Text>
        ) : (
          chapters.map((ch, i) => (
            <View key={ch.chapter_id ?? i} style={styles.chapterRow}>
              {ch.completed ? (
                <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
              ) : (
                <View style={styles.chapterDot} />
              )}
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterTitle}>Chapter {i + 1}</Text>
                {ch.quiz_score != null && (
                  <Text style={styles.chapterMeta}>Quiz: {ch.quiz_score}%</Text>
                )}
              </View>
            </View>
          ))
        )}

        {canClaimCertificate && (
          <Pressable
            style={[styles.certBtn, claiming && styles.certBtnDisabled]}
            onPress={handleClaimCertificate}
            disabled={claiming}
          >
            {claiming ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="ribbon-outline" size={24} color="#FFF" />
                <Text style={styles.certBtnText}>Claim Certificate</Text>
              </>
            )}
          </Pressable>
        )}

        {certificateIssued && (
          <View style={styles.certBadge}>
            <Ionicons name="ribbon" size={24} color="#F59E0B" />
            <Text style={styles.certBadgeText}>Certificate earned</Text>
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: LifeMonkColors.text },
  placeholder: { width: 36 },
  loader: { flex: 1, justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 80 },
  courseTitle: { fontSize: 20, fontWeight: '800', color: LifeMonkColors.text, marginBottom: 24 },
  ringWrap: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  ringWrapInner: {
    alignItems: 'center',
    minWidth: 160,
  },
  ringPercentBig: { fontSize: 48, fontWeight: '800', color: LifeMonkColors.text },
  ringLabel: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  ringBarBg: {
    marginTop: 12,
    height: 8,
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  ringBarFill: {
    height: '100%',
    backgroundColor: LifeMonkColors.accentPrimary,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 28,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
  },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: LifeMonkColors.text },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: LifeMonkColors.text, marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  chapterDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  chapterInfo: { marginLeft: 12, flex: 1 },
  chapterTitle: { fontSize: 15, fontWeight: '600', color: LifeMonkColors.text },
  chapterMeta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  certBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
  },
  certBtnDisabled: { opacity: 0.7 },
  certBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
  },
  certBadgeText: { fontSize: 15, fontWeight: '700', color: '#B45309' },
});
