import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';
import type { CourseData } from './CourseDetailView';
import { CourseDetailView } from './CourseDetailView';

const FALLBACK_IMAGES: Record<string, string> = {
  'Character Building': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&q=80&w=400',
  'Confident Communication': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
  'Better Writing': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=400',
  'Critical Thinking': 'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?auto=format&fit=crop&q=80&w=400',
  'Financial Freedom': 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=400',
  'Future Tech': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400',
  'Social Responsibility': 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=400',
};

const MOCK_COURSES: Record<string, CourseData> = {
  'Character Building': {
    id: '1',
    title: 'Character Building',
    subtitle: 'LIFE SKILLS',
    count: '12 LESSONS',
    headerImg: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&q=80&w=400',
    why: 'Develop essential life values and strong personality traits through interactive lessons.',
    outcomes: 'Emotional intelligence and strong positive habits.',
    testimonials: [{ id: 1, title: 'Great!', thumbnail: 'https://images.unsplash.com/photo-1491013516836-7ad643ee1d56?auto=format&fit=crop&q=80&w=200' }],
    samples: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=200'],
    teachers: [{ name: 'Prof. Sudheer K', university: 'IIT Tirupati', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100' }],
  },
  'Confident Communication': {
    id: '2',
    title: 'Confident Communication',
    subtitle: 'LIFE SKILLS',
    count: '8 LESSONS',
    headerImg: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
    why: 'Master public speaking and active listening to build radical confidence.',
    outcomes: 'Clear articulation and stage fear elimination.',
    testimonials: [{ id: 1, title: 'Wow!', thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=200' }],
    samples: ['https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=200'],
    teachers: [{ name: 'Prof. Sudha Rani', university: 'IIT Tirupati', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100' }],
  },
  'Better Writing': {
    id: '3',
    title: 'Better Writing',
    subtitle: 'LIFE SKILLS',
    count: '10 LESSONS',
    headerImg: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=400',
    why: 'Express your thoughts clearly through creative and structured writing.',
    outcomes: 'Compelling storytelling and improved vocabulary.',
    testimonials: [{ id: 1, title: 'Helpful!', thumbnail: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=200' }],
    samples: ['https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=200'],
    teachers: [{ name: 'Dr. Arpit Jain', university: 'IIM Ahmedabad', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100' }],
  },
  'Critical Thinking': {
    id: '4',
    title: 'Critical Thinking',
    subtitle: 'LIFE SKILLS',
    count: '6 LESSONS',
    headerImg: 'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?auto=format&fit=crop&q=80&w=400',
    why: 'Sharpen your mind with logic and analysis to solve complex issues.',
    outcomes: 'Analytical mindset and logical reasoning.',
    testimonials: [{ id: 1, title: 'Smart!', thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=200' }],
    samples: ['https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=200'],
    teachers: [{ name: 'Dr. Megha S', university: 'IIT Delhi', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100' }],
  },
  'Financial Freedom': {
    id: '5',
    title: 'Financial Freedom',
    subtitle: 'ADVANCED',
    count: '15 LESSONS',
    headerImg: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=400',
    why: 'Learn the secrets of money management and investment.',
    outcomes: 'Financial literacy and wealth creation strategies.',
    testimonials: [{ id: 1, title: 'Essential!', thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' }],
    samples: ['https://images.unsplash.com/photo-1518183275089-703bc70bc325?auto=format&fit=crop&q=80&w=200'],
    teachers: [{ name: 'Dr. Finance', university: 'Global Business School', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100' }],
  },
  'Future Tech': {
    id: '6',
    title: 'Future Tech',
    subtitle: 'ADVANCED',
    count: '20 LESSONS',
    headerImg: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400',
    why: 'Explore AI, Blockchain and Space exploration.',
    outcomes: 'Tech-savviness and future-ready mindset.',
    testimonials: [{ id: 1, title: 'Mind-blowing!', thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=200' }],
    samples: ['https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=200'],
    teachers: [{ name: 'Prof. Astro', university: 'Space University', img: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=100' }],
  },
  'Social Responsibility': {
    id: '7',
    title: 'Social Responsibility',
    subtitle: 'ADVANCED',
    count: '10 LESSONS',
    headerImg: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=400',
    why: 'Understand your impact on society and lead with purpose.',
    outcomes: 'Ethical leadership and community impact.',
    testimonials: [{ id: 1, title: 'Impactful!', thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200' }],
    samples: ['https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=200'],
    teachers: [{ name: 'Dr. Civic', university: 'Civic Honors', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100' }],
  },
};

function PathCard({
  title,
  image,
  onPress,
}: {
  title: string;
  image: string;
  onPress: () => void;
}) {
  const uri = FALLBACK_IMAGES[title] || image || 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&q=80&w=400';

  return (
    <Pressable onPress={onPress} style={styles.pathCard}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', 'transparent', 'rgba(0,0,0,0.3)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.pathCardContent}>
        <Text style={styles.pathCardTitle} numberOfLines={2}>{title}</Text>
      </View>
    </Pressable>
  );
}

export function LearningPathsView({ onBack }: { onBack?: () => void }) {
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);

  const handleCourseClick = (title: string) => {
    const course = MOCK_COURSES[title];
    if (course) setSelectedCourse(course);
  };

  if (selectedCourse) {
    return <CourseDetailView course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LIFE SKILLS</Text>
          <Text style={styles.sectionHeading}>Foundations</Text>
        </View>

        <View style={styles.grid}>
          {(['Character Building', 'Confident Communication', 'Better Writing', 'Critical Thinking'] as const).map((title) => (
            <View key={title} style={styles.cardWrap}>
              <PathCard title={title} image="" onPress={() => handleCourseClick(title)} />
            </View>
          ))}
        </View>

        <View style={[styles.section, { marginTop: 32 }]}>
          <Text style={styles.sectionLabel}>LIFE SKILLS</Text>
          <Text style={styles.sectionHeading}>Advanced</Text>
        </View>

        <View style={styles.grid}>
          {(['Financial Freedom', 'Future Tech', 'Social Responsibility'] as const).map((title) => (
            <View key={title} style={styles.cardWrap}>
              <PathCard title={title} image="" onPress={() => handleCourseClick(title)} />
            </View>
          ))}
        </View>
      </ScrollView>
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
});
