import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';
import {
  DEFAULT_USER_ID,
  fetchCourses,
  getUserCourses,
  type Course,
  type Chapter,
  type UserCourseEntry,
} from '@/src/services/courses';

import { ChapterDetailScreen } from './ChapterDetailScreen';
import type { CourseDetailData } from './CourseDetailView';
import { CourseDetailView } from './CourseDetailView';
import { CertificateView } from './CertificateView';

const CATEGORY_LABELS: Record<string, string> = {
  foundation: 'Foundations',
  academic: 'Academic',
  career: 'Career',
  customized: 'Advanced',
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&q=80&w=400';

function PathCard({
  course,
  enrollment,
  onPress,
}: {
  course: Course;
  enrollment: UserCourseEntry | undefined;
  onPress: () => void;
}) {
  const imageUri = course.cover_image || FALLBACK_IMAGE;
  const progress = enrollment?.progress_percent ?? 0;
  const isEnrolled = enrollment?.enrolled ?? false;
  const showStar = isEnrolled && progress >= 100;

  return (
    <Pressable onPress={onPress} style={styles.pathCard}>
      <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', 'transparent', 'rgba(0,0,0,0.3)']}
        style={StyleSheet.absoluteFill}
      />
      {showStar && (
        <View style={styles.starBadge}>
          <Ionicons name="star" size={20} color="#FFD700" />
        </View>
      )}
      <View style={styles.pathCardContent}>
        <Text style={styles.pathCardTitle} numberOfLines={2}>
          {course.title}
        </Text>
        {isEnrolled && (
          <View style={styles.progressBarWrap}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function SkeletonCard() {
  return (
    <View style={[styles.pathCard, styles.skeletonCard]}>
      <View style={styles.skeletonShimmer} />
      <View style={styles.pathCardContent}>
        <View style={[styles.skeletonLine, { width: '80%', height: 16 }]} />
        <View style={[styles.skeletonLine, { width: '50%', height: 12, marginTop: 8 }]} />
      </View>
    </View>
  );
}

export function LearningPathsView({ onBack }: { onBack?: () => void }) {
  const [selectedCourse, setSelectedCourse] = useState<CourseDetailData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userCourses, setUserCourses] = useState<UserCourseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesRes, userCoursesRes] = await Promise.all([
        fetchCourses(),
        getUserCourses(DEFAULT_USER_ID),
      ]);
      setCourses(coursesRes);
      setUserCourses(Array.isArray(userCoursesRes) ? userCoursesRes : []);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load courses';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const enrollmentMap = React.useMemo(() => {
    const m: Record<string, UserCourseEntry> = {};
    userCourses.forEach((uc) => {
      m[uc.strapi_course_id] = uc;
    });
    return m;
  }, [userCourses]);

  const grouped = React.useMemo(() => {
    const groups: Record<string, Course[]> = {};
    const order = ['foundation', 'academic', 'career', 'customized'];
    order.forEach((cat) => (groups[cat] = []));
    courses.forEach((c) => {
      const cat = (c.category || 'foundation').toLowerCase();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(c);
    });
    return groups;
  }, [courses]);

  const handleCourseClick = (course: Course) => {
    const enrollment = enrollmentMap[course.documentId];
    setSelectedCourse({
      course,
      enrollment: enrollment ?? null,
      userId: DEFAULT_USER_ID,
    });
  };

  const [selectedChapter, setSelectedChapter] = useState<{ course: Course; chapter: Chapter } | null>(null);
  const [certificateView, setCertificateView] = useState<{ course: Course; date: string } | null>(null);
  const [courseDetailKey, setCourseDetailKey] = useState(0);

  if (certificateView) {
    return (
      <CertificateView
        course={certificateView.course}
        date={certificateView.date}
        onBack={() => setCertificateView(null)}
      />
    );
  }

  if (selectedChapter) {
    return (
      <ChapterDetailScreen
        course={selectedChapter.course}
        chapter={selectedChapter.chapter}
        userId={DEFAULT_USER_ID}
        onBack={() => setSelectedChapter(null)}
        onComplete={() => {
          setSelectedChapter(null);
          setCourseDetailKey((k) => k + 1);
          load();
        }}
      />
    );
  }

  if (selectedCourse) {
    return (
      <CourseDetailView
        key={`${selectedCourse.course.documentId}-${courseDetailKey}`}
        courseDetail={selectedCourse}
        onBack={() => setSelectedCourse(null)}
        onEnrolled={() => load()}
        onOpenChapter={(course, chapter) => setSelectedChapter({ course, chapter })}
        onShowCertificate={(course, date) => setCertificateView({ course, date })}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={LifeMonkColors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Learning Paths</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <View style={[styles.skeletonLine, { width: 120, height: 12, marginBottom: 8 }]} />
            <View style={[styles.skeletonLine, { width: 180, height: 28 }]} />
          </View>
          <View style={styles.grid}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.cardWrap}>
                <SkeletonCard />
              </View>
            ))}
          </View>
          <View style={[styles.section, { marginTop: 32 }]}>
            <View style={[styles.skeletonLine, { width: 100, height: 12, marginBottom: 8 }]} />
            <View style={[styles.skeletonLine, { width: 140, height: 28 }]} />
          </View>
          <View style={styles.grid}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.cardWrap}>
                <SkeletonCard />
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {(['foundation', 'academic', 'career', 'customized'] as const).map((cat) => {
            const list = grouped[cat] || [];
            const label = CATEGORY_LABELS[cat] ?? cat;
            if (list.length === 0) return null;
            return (
              <React.Fragment key={cat}>
                <View style={[styles.section, list.length > 0 && cat !== 'foundation' ? { marginTop: 32 } : undefined]}>
                  <Text style={styles.sectionLabel}>LIFE SKILLS</Text>
                  <Text style={styles.sectionHeading}>{label}</Text>
                </View>
                <View style={styles.grid}>
                  {list.map((course) => (
                    <View key={course.documentId} style={styles.cardWrap}>
                      <PathCard
                        course={course}
                        enrollment={enrollmentMap[course.documentId]}
                        onPress={() => handleCourseClick(course)}
                      />
                    </View>
                  ))}
                </View>
              </React.Fragment>
            );
          })}
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
    paddingVertical: 20,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: LifeMonkColors.text },
  placeholder: { width: 44 },
  scroll: { flex: 1 },
  scrollContent: { padding: LifeMonkSpacing.contentPadding, paddingBottom: 100 },
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: '#999', letterSpacing: 2, marginBottom: 8 },
  sectionHeading: { fontSize: 36, fontWeight: '800', color: LifeMonkColors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cardWrap: {
    width: '48%',
    height: 170,
    borderRadius: 28,
    overflow: 'hidden',
  },
  pathCard: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
  pathCardContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
  },
  pathCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFF',
    maxWidth: 140,
  },
  progressBarWrap: { marginTop: 8 },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 2,
  },
  starBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonCard: { backgroundColor: '#E5E7EB' },
  skeletonShimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  skeletonLine: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 4,
  },
});
