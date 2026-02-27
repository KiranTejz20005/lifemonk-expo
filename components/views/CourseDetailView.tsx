import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LifeMonkColors, LifeMonkSpacing, LifeMonkTypography } from '@/constants/lifemonk-theme';

export interface Teacher {
  name: string;
  university: string;
  img: string;
}

export interface Testimonial {
  id: number;
  title: string;
  thumbnail: string;
}

export interface CourseData {
  id: string;
  title: string;
  subtitle: string;
  count: string;
  headerImg: string;
  why: string;
  outcomes: string;
  testimonials: Testimonial[];
  samples: string[];
  teachers: Teacher[];
}

type TabType = 'Details' | 'Chapters' | 'Challenges';

export function CourseDetailView({ course, onBack }: { course: CourseData; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<TabType>('Details');

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
        <Pressable style={styles.enrollTop}>
          <Text style={styles.enrollTopText}>enroll now</Text>
        </Pressable>
        <View style={styles.headerImgWrap}>
          <Image source={{ uri: course.headerImg }} style={StyleSheet.absoluteFill} />
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
        <Section title="Why to take this course?" body={course.why} />
        <Section title="Outcomes of the course?" body={course.outcomes} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teacher Monks</Text>
          <View style={styles.teachersRow}>
            {course.teachers.map((t, i) => (
              <View key={i} style={styles.teacher}>
                <Image source={{ uri: t.img }} style={styles.teacherImg} />
                <Text style={styles.teacherName}>{t.name}</Text>
                <Text style={styles.teacherUni}>{t.university}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Pressable style={styles.stickyBottom}>
        <LinearGradient
          colors={['#4C6FFF', '#7B61FF', '#A147E5']}
          style={styles.enrollBottom}
        >
          <Text style={styles.enrollBottomSub}>Already 27 Students learning</Text>
          <Text style={styles.enrollBottomTitle}>ENROL NOW</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
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
  teachersRow: { flexDirection: 'row', gap: 24, flexWrap: 'wrap' },
  teacher: { alignItems: 'center', width: 80 },
  teacherImg: { width: 64, height: 64, borderRadius: 32 },
  teacherName: { fontSize: 12, fontWeight: '800', color: '#111', marginTop: 8 },
  teacherUni: { fontSize: 11, color: '#6B7280', marginTop: 2 },
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
});
