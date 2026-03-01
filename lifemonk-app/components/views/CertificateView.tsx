import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { LifeMonkColors } from '@/constants/lifemonk-theme';
import type { Course } from '@/src/services/courses';

const STUDENT_NAME = 'Student'; // TODO: from auth

export function CertificateView({
  course,
  date,
  onBack,
}: {
  course: Course;
  date: string;
  onBack: () => void;
}) {
  const handleShare = async () => {
    try {
      await Share.share({
        message: `I completed the course "${course.title}" on Life Monk. Certificate date: ${date}`,
        title: `Certificate - ${course.title}`,
      });
    } catch {
      Alert.alert('Share', 'Sharing is not available');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Certificate</Text>
      </View>

      <View style={styles.cardWrap}>
        <LinearGradient
          colors={['#FFFBEB', '#FEF3C7', '#FDE68A']}
          style={styles.card}
        >
          <View style={styles.cardInner}>
            <View style={styles.badge}>
              <Ionicons name="ribbon" size={48} color="#B45309" />
            </View>
            <Text style={styles.cardLabel}>Certificate of Completion</Text>
            <Text style={styles.courseName}>{course.title}</Text>
            <Text style={styles.studentName}>{STUDENT_NAME}</Text>
            <Text style={styles.date}>{date}</Text>
          </View>
        </LinearGradient>
      </View>

      <Pressable style={styles.shareBtn} onPress={handleShare}>
        <Ionicons name="share-social" size={22} color="#FFF" />
        <Text style={styles.shareBtnText}>Share</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LifeMonkColors.bgApp,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: LifeMonkColors.text },
  cardWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  card: { padding: 32 },
  cardInner: { alignItems: 'center' },
  badge: { marginBottom: 16 },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 2,
    marginBottom: 8,
  },
  courseName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  studentName: { fontSize: 17, fontWeight: '600', color: '#374151', marginBottom: 8 },
  date: { fontSize: 14, color: '#6B7280' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: LifeMonkColors.accentPrimary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  shareBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
