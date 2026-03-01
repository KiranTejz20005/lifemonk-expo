import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InspiredCarousel } from '@/components/views/InspiredCarousel';
import { LearningPathsView } from '@/components/views/LearningPathsView';
import { PracticeView } from '@/components/views/PracticeView';
import { LifeMonkColors, LifeMonkSpacing, LifeMonkTypography } from '@/constants/lifemonk-theme';

const TABS = ['Learn', 'Monk Mode', 'Practice'] as const;
type Tab = (typeof TABS)[number];

const INSPIRATIONS = [
  { id: 1, quote: 'No more excuses.', author: 'Nature', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773' },
  { id: 2, quote: 'Keep going.', author: 'Mind', img: 'https://images.unsplash.com/photo-14436756700b-02fcb009e0b' },
  { id: 3, quote: 'Your only limit is you.', author: 'Life', img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470' },
  { id: 4, quote: 'Breath in, Breath out.', author: 'Soul', img: 'https://images.unsplash.com/photo-1545389336-cf090694435e' },
];

export interface HomeScreenProps {
  userName: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onProfileClick: () => void;
  onJournalClick: () => void;
  onChallengesClick: () => void;
  onBreathingClick: () => void;
  onFocusClick: () => void;
}

export function HomeScreen({
  userName,
  activeTab,
  onTabChange,
  onProfileClick,
  onJournalClick,
  onChallengesClick,
  onBreathingClick,
  onFocusClick,
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  const [segmentWidth, setSegmentWidth] = useState(0);
  const activeIndex = TABS.indexOf(activeTab as Tab);
  const indicatorStyle = useAnimatedStyle(() => {
    const tabW = segmentWidth > 0 ? (segmentWidth - 8) / TABS.length : 0;
    const targetX = activeIndex * tabW;

    return { transform: [{ translateX: targetX }] };
  }, [activeIndex, segmentWidth]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setIsActive(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (activeTab === 'Learn') {
    return (
      <Animated.View key="learn" entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={styles.container}>
        <LearningPathsView onBack={() => onTabChange('Monk Mode')} />
      </Animated.View>
    );
  }
  if (activeTab === 'Practice') {
    return (
      <Animated.View key="practice" entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={styles.container}>
        <PracticeView onBack={() => onTabChange('Monk Mode')} userName={userName} />
      </Animated.View>
    );
  }

  return (
    <Animated.View key="monk" entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={styles.container}>
      {activeTab === 'Monk Mode' && (
        <View style={[styles.headerWrap, { paddingTop: insets.top + 12 }]}>
          <View style={styles.logoRow}>
            <Text style={styles.logoText}>Life Monk</Text>
          </View>
          <View style={styles.header}>
            <Pressable onPress={onProfileClick} style={styles.profileBtn}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100' }}
                style={StyleSheet.absoluteFill}
              />
            </Pressable>
            <View style={styles.segmentWrap} onLayout={(e) => setSegmentWidth(e.nativeEvent.layout.width)}>
              {segmentWidth > 0 && (
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    { width: (segmentWidth - 8) / TABS.length, backgroundColor: '#FFF', borderRadius: 20, margin: 4, height: 'auto' },
                    indicatorStyle
                  ]}
                />
              )}
              {TABS.map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => onTabChange(tab)}
                  style={styles.segmentItem}
                >
                  <Text style={[styles.segmentText, activeTab === tab && styles.segmentTextActive]}>{tab}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: LifeMonkSpacing.bottomBarHeight + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'Monk Mode' && (
          <>
            <Pressable onPress={onBreathingClick} style={styles.welcomeCard}>
              <Text style={styles.welcomeLabel}>HEY! {userName}</Text>
              <View style={styles.meditationWrap}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&q=80&w=400' }}
                  style={styles.meditationImg}
                />
              </View>
              <Text style={styles.welcomeCta}>Take a deep breath</Text>
            </Pressable>

            <Pressable onPress={onJournalClick}>
              <LinearGradient colors={['#8B5CF6', '#6E44FF']} style={styles.reflectionCard}>
                <View style={styles.reflectionRow}>
                  <View style={styles.reflectionIcon}>
                    <Ionicons name="bulb-outline" size={24} color="#FFF" />
                  </View>
                  <Text style={styles.reflectionTitle}>Today's Reflection</Text>
                </View>
                <Text style={styles.reflectionSub}>Write your thoughts for the day</Text>
              </LinearGradient>
            </Pressable>

            <Pressable onPress={onFocusClick}>
              <LinearGradient colors={['#FF9B71', '#FF6B4A']} style={styles.focusCard}>
                <View style={styles.focusHeader}>
                  <Ionicons name="compass-outline" size={16} color="#FFF" />
                  <Text style={styles.focusLabel}>FOCUS MODE</Text>
                </View>
                <View style={styles.focusRow}>
                  <View>
                    <Text style={styles.focusTimer}>{formatTime(timeLeft)}</Text>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setIsActive(!isActive);
                      }}
                      style={styles.focusStartBtn}
                    >
                      <Text style={styles.focusStartText}>{isActive ? 'PAUSE' : 'START'}</Text>
                    </Pressable>
                  </View>
                  <View style={styles.focusImgWrap}>
                    <Image
                      source={{ uri: 'https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&q=80&w=200' }}
                      style={styles.focusTimerImg}
                    />
                  </View>
                </View>
              </LinearGradient>
            </Pressable>

            <Pressable onPress={onChallengesClick} style={styles.challengeCard}>
              <View style={styles.challengeHeader}>
                <View style={styles.challengeIconWrap}>
                  <Ionicons name="flag-outline" size={24} color={LifeMonkColors.accentPrimary} />
                </View>
                <Text style={styles.challengeTitle}>Challenge yourself</Text>
              </View>
              <ChallengeItem text="Read 5 book summaries" active />
              <ChallengeItem text="Go vegan for a day" />
              <View style={styles.moreBtn}>
                <Text style={styles.moreBtnText}>12 more...</Text>
              </View>
            </Pressable>

            <InspiredCarousel inspirations={INSPIRATIONS} />
          </>
        )}
      </ScrollView>
    </Animated.View>
  );
}

function ChallengeItem({ text, active }: { text: string; active?: boolean }) {
  return (
    <View style={styles.challengeItem}>
      <View style={[styles.challengeDot, active && styles.challengeDotActive]}>
        {active && <Ionicons name="checkmark" size={16} color="#FFF" />}
      </View>
      <Text style={[styles.challengeItemText, !active && styles.challengeItemTextInactive]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: {
    paddingHorizontal: LifeMonkSpacing.contentPadding,
    paddingBottom: LifeMonkSpacing.spacingSm,
    gap: LifeMonkSpacing.spacingXs,
  },
  logoRow: {
    height: LifeMonkSpacing.touchTarget * 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: LifeMonkColors.text,
    letterSpacing: -0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LifeMonkSpacing.spacingSm,
  },
  profileBtn: {
    width: LifeMonkSpacing.touchTarget,
    height: LifeMonkSpacing.touchTarget,
    borderRadius: LifeMonkSpacing.touchTarget / 2,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  segmentWrap: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1C252E',
    padding: 4,
    borderRadius: 24,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  segmentItemActive: { backgroundColor: '#FFF' },
  segmentText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  segmentTextActive: { color: LifeMonkColors.text },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: LifeMonkSpacing.contentPadding,
    paddingTop: LifeMonkSpacing.spacingMd,
    gap: LifeMonkSpacing.spacingMd,
  },
  welcomeCard: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 24,
    padding: LifeMonkSpacing.cardPadding,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  welcomeLabel: {
    fontSize: LifeMonkTypography.fontXs,
    color: 'rgba(17,17,17,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  meditationWrap: { width: 72, height: 72, marginBottom: 8 },
  meditationImg: { width: '100%', height: '100%', borderRadius: 36 },
  welcomeCta: { fontSize: LifeMonkTypography.fontLg, fontWeight: '600', color: LifeMonkColors.text },
  reflectionCard: {
    borderRadius: 24,
    padding: LifeMonkSpacing.cardPadding,
  },
  reflectionRow: { flexDirection: 'row', alignItems: 'center', gap: LifeMonkSpacing.spacingSm },
  reflectionIcon: {
    width: LifeMonkSpacing.touchTarget,
    height: LifeMonkSpacing.touchTarget,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reflectionTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  reflectionSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 6 },
  focusCard: { borderRadius: 24, padding: LifeMonkSpacing.cardPadding },
  focusHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  focusLabel: { fontSize: 11, fontWeight: '700', color: '#FFF', letterSpacing: 2 },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: LifeMonkSpacing.spacingLg,
  },
  focusTimer: { fontSize: 40, fontWeight: '700', color: '#FFF' },
  focusStartBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  focusStartText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  focusImgWrap: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 12 },
  focusTimerImg: { width: '100%', height: '100%' },
  challengeCard: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 24,
    padding: LifeMonkSpacing.cardPadding,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: LifeMonkSpacing.spacingSm, marginBottom: 16 },
  challengeIconWrap: {
    width: LifeMonkSpacing.touchTarget,
    height: LifeMonkSpacing.touchTarget,
    borderRadius: 12,
    backgroundColor: 'rgba(99,102,241,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeTitle: { fontSize: 17, fontWeight: '700', color: LifeMonkColors.text },
  challengeItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  challengeDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeDotActive: { backgroundColor: LifeMonkColors.accentPrimary, borderColor: LifeMonkColors.accentPrimary },
  challengeItemText: { fontSize: 15, fontWeight: '500', color: LifeMonkColors.text },
  challengeItemTextInactive: { color: LifeMonkColors.textMuted },
  moreBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#EEF1FF',
    borderRadius: 16,
  },
  moreBtnText: { fontSize: 13, fontWeight: '600', color: LifeMonkColors.accentPrimary },
});
