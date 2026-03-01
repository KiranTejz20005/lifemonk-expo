import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';
import {
  getHomeScreenCourses,
  getCategories,
  type Category,
  type Course,
  type Chapter,
  type MergedCourse,
} from '@/src/services/courses';
import { getCurrentStudent } from '@/src/services/auth';

import { CourseProgressScreen } from '@/components/screens/CourseProgressScreen';
import { ChapterDetailScreen } from './ChapterDetailScreen';
import type { CourseDetailData } from './CourseDetailView';
import { CourseDetailView } from './CourseDetailView';
import { CertificateView } from './CertificateView';

// Gradient colors by category name (fallback when no cover_image_url)
const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  Academic: ['#3B82F6', '#1D4ED8'],
  Career: ['#10B981', '#059669'],
  Foundation: ['#8B5CF6', '#6D28D9'],
  foundation: ['#8B5CF6', '#6D28D9'],
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
  onPress,
}: {
  course: MergedCourse;
  onPress: () => void;
}) {
  const hasCover = Boolean(course.cover_image_url);
  const progress = course.progress_percent ?? 0;
  const isEnrolled = course.enrolled ?? false;
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
        <Text style={styles.pathCardCategory} numberOfLines={1}>
          {course.category || 'General'}
        </Text>
        <Text style={styles.pathCardTitle} numberOfLines={2}>
          {course.title}
        </Text>
        {isEnrolled && (
          <View style={styles.enrolledRow}>
            <View style={styles.enrolledBadge}>
              <Text style={styles.enrolledBadgeText}>Enrolled</Text>
            </View>
            <View style={styles.progressBarWrap}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
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

const ALL_CATEGORIES = 'All';

export function LearningPathsView({ onBack }: { onBack?: () => void }) {
  const [selectedCourse, setSelectedCourse] = useState<CourseDetailData | null>(null);
  const [courses, setCourses] = useState<MergedCourse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noCoursesForGrade, setNoCoursesForGrade] = useState(false);
  const [userType, setUserType] = useState('ultra');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHomeScreenCourses();
      console.log('Total courses loaded:', data.length);

      const [strapiCats, student] = await Promise.all([
        getCategories().catch(() => []),
        getCurrentStudent(),
      ]);

      setUserType(student?.subscription_type ?? 'ultra');
      setNoCoursesForGrade(data.length === 0);
      setCourses(data);

      const categoryNames = new Set(data.map((c) => c.category || 'Uncategorized'));
      const derivedCats: Category[] = strapiCats.length > 0
        ? strapiCats
        : Array.from(categoryNames).map((name, i) => ({
            id: i + 1,
            documentId: name,
            name,
            description: null,
            visibility: 'public',
            image_url: null,
            order: i,
            is_active: true,
          }));
      setCategories(derivedCats);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load courses';
      setError(message);
      setCourses([]);
      setCategories([]);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleCourses = React.useMemo(() => {
    return courses.filter((c) => {
      const v = c.user_type_visibility || 'all';
      if (v === 'all') return true;
      if (v === 'ultra_only') return userType === 'ultra';
      if (v === 'premium_ultra') return userType !== 'school';
      return true;
    });
  }, [courses, userType]);

  const filteredByCategory = React.useMemo(() => {
    if (selectedCategory === ALL_CATEGORIES) return visibleCourses;
    return visibleCourses.filter((c) => (c.category || 'Uncategorized') === selectedCategory);
  }, [visibleCourses, selectedCategory]);

  const grouped = React.useMemo(() => {
    const acc: Record<string, MergedCourse[]> = {};
    filteredByCategory.forEach((course) => {
      const cat = course.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(course);
    });
    return acc;
  }, [filteredByCategory]);

  const handleCourseClick = (course: MergedCourse) => {
    setSelectedCourse({
      course,
      enrollment: {
        enrolled: course.enrolled,
        progress_percent: course.progress_percent,
        strapi_course_id: course.documentId,
      },
      userId: 0,
    });
  };

  const [selectedChapter, setSelectedChapter] = useState<{ course: Course; chapter: Chapter } | null>(null);
  const [certificateView, setCertificateView] = useState<{ course: Course; date: string } | null>(null);
  const [progressCourse, setProgressCourse] = useState<Course | null>(null);
  const [courseDetailKey, setCourseDetailKey] = useState(0);

  if (progressCourse) {
    return (
      <CourseProgressScreen
        course={progressCourse}
        onBack={() => setProgressCourse(null)}
        onClaimCertificate={(course, date) => {
          setProgressCourse(null);
          setCertificateView({ course, date });
        }}
      />
    );
  }

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
        onShowProgress={(course) => setProgressCourse(course)}
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

      {!loading && !error && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryTabs}
          contentContainerStyle={styles.categoryTabsContent}
        >
          <Pressable
            style={[styles.categoryChip, selectedCategory === ALL_CATEGORIES && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(ALL_CATEGORIES)}
          >
            <Text style={[styles.categoryChipText, selectedCategory === ALL_CATEGORIES && styles.categoryChipTextActive]}>
              {ALL_CATEGORIES}
            </Text>
          </Pressable>
          {categories.map((cat) => (
            <Pressable
              key={cat.documentId}
              style={[styles.categoryChip, selectedCategory === cat.name && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat.name)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat.name && styles.categoryChipTextActive]}>
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

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
          <Text style={styles.errorSubtext}>If this persists, check your connection.</Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {Object.keys(grouped).length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                {noCoursesForGrade ? 'No courses available for your grade yet' : 'No courses yet.'}
              </Text>
              <Text style={styles.emptySubtext}>Check back later or try another category.</Text>
            </View>
          ) : (
            Object.entries(grouped).map(([categoryName, list], index) => {
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
                          onPress={() => handleCourseClick(course)}
                        />
                      </View>
                    ))}
                  </View>
                </React.Fragment>
              );
            })
          )}
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
  pathCardCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 2,
  },
  pathCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFF',
    maxWidth: 140,
  },
  enrolledRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  enrolledBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(34,197,94,0.9)',
  },
  enrolledBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  progressBarWrap: { flex: 1, marginTop: 0 },
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
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
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
  categoryTabs: { maxHeight: 48, marginBottom: 8 },
  categoryTabsContent: { paddingHorizontal: LifeMonkSpacing.contentPadding, gap: 8, paddingVertical: 8 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: LifeMonkColors.accentPrimary },
  categoryChipText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  categoryChipTextActive: { color: '#FFF' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 18, fontWeight: '700', color: LifeMonkColors.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#6B7280' },
});
