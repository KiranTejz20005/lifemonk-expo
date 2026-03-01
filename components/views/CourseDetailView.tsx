import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';
import type { Course, Chapter, CourseProgress } from '@/src/services/courses';
import {
  enrollCourse,
  fetchChaptersByCourse,
  getCourseProgress,
  issueCertificate,
} from '@/src/services/courses';

export interface CourseDetailData {
  course: Course;
  enrollment: { enrolled: boolean; progress_percent: number; strapi_course_id: string } | null;
  userId: number;
}

type TabType = 'Details' | 'Chapters' | 'Challenges';

const CHAPTER_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  video: 'play-circle',
  text: 'document-text',
  quiz: 'help-circle',
  activity: 'star',
};

export function CourseDetailView({
  courseDetail,
  onBack,
  onEnrolled,
  onOpenChapter,
  onShowCertificate,
}: {
  courseDetail: CourseDetailData;
  onBack: () => void;
  onEnrolled?: () => void;
  onOpenChapter?: (course: Course, chapter: Chapter) => void;
  onShowCertificate?: (course: Course, date: string) => void;
}) {
  const { course, enrollment, userId } = courseDetail;
  const [activeTab, setActiveTab] = useState<TabType>('Details');
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [claimingCert, setClaimingCert] = useState(false);

  const isEnrolled = enrollment?.enrolled ?? false;

  const loadProgress = useCallback(async () => {
    if (!isEnrolled) return;
    try {
      const p = await getCourseProgress(userId, course.documentId);
      setProgress(p ?? null);
    } catch {
      setProgress(null);
    }
  }, [userId, course.documentId, isEnrolled]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    if (activeTab !== 'Chapters') return;
    console.log('[CourseDetailView] Chapters tab: course object', { documentId: course.documentId, title: course.title, id: course.id });
    setChaptersLoading(true);
    fetchChaptersByCourse(course.documentId)
      .then((chaptersResponse) => {
        console.log('[CourseDetailView] Chapters response', chaptersResponse);
        setChapters(chaptersResponse);
      })
      .catch((err) => {
        console.log('[CourseDetailView] Chapters fetch error', err);
        setChapters([]);
      })
      .finally(() => setChaptersLoading(false));
  }, [activeTab, course.documentId, course.title, course.id]);

  const handleEnroll = async () => {
    if (enrolling || isEnrolled) return;
    setEnrolling(true);
    try {
      await enrollCourse(userId, course.documentId);
      Alert.alert('Success', 'You are enrolled!');
      onEnrolled?.();
      loadProgress();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const handleClaimCertificate = async () => {
    if (claimingCert || !progress || progress.progress_percent < 100) return;
    setClaimingCert(true);
    try {
      await issueCertificate(userId, course.documentId);
      const date = new Date().toLocaleDateString();
      onShowCertificate?.(course, date);
      loadProgress();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not issue certificate');
    } finally {
      setClaimingCert(false);
    }
  };

  const progressPercent = progress?.progress_percent ?? enrollment?.progress_percent ?? 0;
  const certificateIssued = progress?.certificate_issued ?? false;
  const canClaimCertificate = isEnrolled && progressPercent >= 100 && !certificateIssued;
  const chapterCompletedMap = new Map(
    (progress?.chapters ?? []).map((c) => [c.strapi_chapter_id, c.is_completed])
  );

  const headerImg = course.cover_image || 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&q=80&w=400';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerLabel}>Learning Path</Text>
            <Text style={styles.headerTitle}>{course.title}</Text>
          </View>
        </View>
        {!isEnrolled && (
          <Pressable style={styles.enrollTop} onPress={handleEnroll} disabled={enrolling}>
            {enrolling ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.enrollTopText}>enroll now</Text>
            )}
          </Pressable>
        )}
        <View style={styles.headerImgWrap}>
          <Image source={{ uri: headerImg }} style={StyleSheet.absoluteFill} />
        </View>
      </View>

      <View style={styles.tabBar}>
        {(['Details', 'Chapters', 'Challenges'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={styles.tabItem}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'Details' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{course.title}</Text>
              <Text style={styles.sectionBody}>{course.short_description}</Text>
              {course.estimated_hours != null && course.estimated_hours > 0 && (
                <Text style={styles.estimatedHours}>Estimated: {course.estimated_hours} hours</Text>
              )}
            </View>
            {isEnrolled && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your progress</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.progressText}>{progressPercent}% complete</Text>
              </View>
            )}
            {(course.instructor_name || course.instructor_bio) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructor</Text>
                <View style={styles.teachersRow}>
                  <View style={styles.teacher}>
                    {course.instructor_image ? (
                      <Image source={{ uri: course.instructor_image }} style={styles.teacherImg} />
                    ) : (
                      <View style={[styles.teacherImg, styles.teacherImgPlaceholder]}>
                        <Ionicons name="person" size={28} color="#9CA3AF" />
                      </View>
                    )}
                    <Text style={styles.teacherName}>{course.instructor_name || 'Instructor'}</Text>
                    <Text style={styles.teacherUni} numberOfLines={3}>{course.instructor_bio}</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {activeTab === 'Chapters' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chapters</Text>
            {chaptersLoading ? (
              <ActivityIndicator style={{ marginVertical: 24 }} />
            ) : (
              chapters.map((ch, index) => {
                const prevOrder = index > 0 ? chapters[index - 1].order : -1;
                const prevCompleted = index > 0 ? chapterCompletedMap.get(chapters[index - 1].documentId) : true;
                const isCompleted = chapterCompletedMap.get(ch.documentId);
                const isLocked = ch.is_locked && !prevCompleted;
                const isCurrent = !isLocked && !isCompleted && (index === 0 || prevCompleted);
                const iconName = CHAPTER_TYPE_ICONS[ch.chapter_type] ?? 'document-text';

                return (
                  <Pressable
                    key={ch.documentId}
                    style={[
                      styles.chapterRow,
                      isLocked && styles.chapterRowLocked,
                      isCurrent && styles.chapterRowCurrent,
                    ]}
                    onPress={() => {
                      if (isLocked) {
                        const prevNum = index;
                        Alert.alert('Locked', `Complete chapter ${prevNum} first`);
                        return;
                      }
                      onOpenChapter?.(course, ch);
                    }}
                  >
                    <View style={styles.chapterLeft}>
                      {isLocked ? (
                        <Ionicons name="lock-closed" size={22} color="#9CA3AF" />
                      ) : isCompleted ? (
                        <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
                      ) : (
                        <Ionicons name={iconName} size={22} color={LifeMonkColors.accentPrimary} />
                      )}
                      <View style={styles.chapterInfo}>
                        <Text style={[styles.chapterTitle, isLocked && styles.chapterTitleLocked]}>
                          {ch.order}. {ch.title}
                        </Text>
                        <Text style={styles.chapterMeta}>
                          {ch.chapter_type} {ch.duration_minutes ? ` · ${ch.duration_minutes} min` : ''}
                        </Text>
                      </View>
                    </View>
                    {!isLocked && <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
                  </Pressable>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'Challenges' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Challenges</Text>
            <Text style={styles.sectionBody}>Challenges for this course coming soon.</Text>
          </View>
        )}
      </ScrollView>

      {!isEnrolled && (
        <Pressable style={styles.stickyBottom} onPress={handleEnroll} disabled={enrolling}>
          <LinearGradient
            colors={['#4C6FFF', '#7B61FF', '#A147E5']}
            style={styles.enrollBottom}
          >
            <Text style={styles.enrollBottomSub}>Start your journey</Text>
            <Text style={styles.enrollBottomTitle}>ENROL NOW</Text>
          </LinearGradient>
        </Pressable>
      )}

      {canClaimCertificate && (
        <Pressable style={styles.stickyBottom} onPress={handleClaimCertificate} disabled={claimingCert}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.enrollBottom}
          >
            {claimingCert ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.enrollBottomSub}>You completed this course!</Text>
                <Text style={styles.enrollBottomTitle}>CLAIM CERTIFICATE</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      )}

      {isEnrolled && progressPercent >= 100 && certificateIssued && (
        <View style={styles.stickyBottom}>
          <View style={styles.certificateBadge}>
            <Ionicons name="ribbon" size={24} color="#F59E0B" />
            <Text style={styles.certificateBadgeText}>Certificate earned</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    backgroundColor: '#0A0D14',
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 0,
    minHeight: 220,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  backBtn: { padding: 4 },
  headerText: { flex: 1, marginLeft: 8 },
  headerLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginTop: 4 },
  enrollTop: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#4C6FFF',
    borderRadius: 10,
  },
  enrollTopText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  headerImgWrap: {
    position: 'absolute',
    right: 0,
    top: 48,
    width: '45%',
    height: 200,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1C252E',
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  tabItem: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.4)' },
  tabTextActive: { color: '#FFF' },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#4C6FFF',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 120 },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: LifeMonkColors.text,
    marginBottom: 8,
  },
  sectionBody: { fontSize: 14, color: '#374151', lineHeight: 22 },
  estimatedHours: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 4,
  },
  progressText: { fontSize: 13, color: '#6B7280', marginTop: 6 },
  teachersRow: { flexDirection: 'row', gap: 24, flexWrap: 'wrap' },
  teacher: { alignItems: 'center', width: 120 },
  teacherImg: { width: 64, height: 64, borderRadius: 32 },
  teacherImgPlaceholder: { backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  teacherName: { fontSize: 12, fontWeight: '800', color: '#111', marginTop: 8 },
  teacherUni: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  chapterRowLocked: { backgroundColor: '#F3F4F6', opacity: 0.8 },
  chapterRowCurrent: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE' },
  chapterLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  chapterInfo: { marginLeft: 12, flex: 1 },
  chapterTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  chapterTitleLocked: { color: '#9CA3AF' },
  chapterMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  stickyBottom: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  enrollBottom: {
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enrollBottomSub: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  enrollBottomTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  certificateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  certificateBadgeText: { fontSize: 15, fontWeight: '700', color: '#B45309' },
});
