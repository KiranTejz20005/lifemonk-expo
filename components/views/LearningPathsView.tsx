import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';
import {
  DEFAULT_USER_ID,
  DEFAULT_USER_TYPE,
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

// Gradient colors by category name (fallback when no cover_image_url)
const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  Academic: ['#3B82F6', '#1D4ED8'],
  Career: ['#10B981', '#059669'],
  Foundation: ['#8B5CF6', '#6D28D9'],
  Foundations: ['#8B5CF6', '#6D28D9'],
  Advanced: ['#F59E0B', '#D97706'],
  Uncategorized: ['#6B7280', '#4B5563'],
};
const DEFAULT_GRADIENT: [string, string] = ['#4C6FFF', '#7B61FF'];

function getGradientForCategory(category: string): [string, string] {
  return CATEGORY_GRADIENTS[category] ?? DEFAULT_GRADIENT;
}

function PathCard({
  course,
  enrollment,
  onPress,
}: {
  course: Course;
  enrollment: UserCourseEntry | undefined;
  onPress: () => void;
}) {
  const hasCover = Boolean(course.cover_image_url);
  const progress = enrollment?.progress_percent ?? 0;
  const isEnrolled = enrollment?.enrolled ?? false;
  const showStar = isEnrolled && progress >= 100;

  return (
    <Pressable onPress={onPress} style={styles.pathCard}>
      {hasCover ? (
        <Image source={{ uri: course.cover_image_url! }} style={StyleSheet.absoluteFill} />
      ) : (
        <LinearGradient
          colors={[...getGradientForCategory(course.category), 'rgba(0,0,0,0.3)']}
          style={StyleSheet.absoluteFill}
        />
      )}
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

  // Visibility: all → everyone; premium_ultra → hide from school; ultra_only → only ultra. For now userType = 'ultra' → show all.
  const userType = DEFAULT_USER_TYPE;
  const visibleCourses = React.useMemo(() => {
    return courses.filter((c) => {
      const v = c.user_type_visibility || 'all';
      if (v === 'all') return true;
      if (v === 'ultra_only') return userType === 'ultra';
      if (v === 'premium_ultra') return userType !== 'school';
      return true;
    });
  }, [courses, userType]);

  const grouped = React.useMemo(() => {
    const acc: Record<string, Course[]> = {};
    visibleCourses.forEach((course) => {
      const cat = course.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(course);
    });
    return acc;
  }, [visibleCourses]);

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
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {Object.entries(grouped).map(([categoryName, list], index) => {
            if (list.length === 0) return null;
            return (
              <React.Fragment key={categoryName}>
                <View style={[styles.section, index > 0 ? { marginTop: 32 } : undefined]}>
                  <Text style={styles.sectionHeading}>{categoryName}</Text>
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
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: LifeMonkColors.accentPrimary,
    borderRadius: 12,
  },
  retryBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
