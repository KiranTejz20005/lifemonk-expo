import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LifeMonkSpacing } from '@/constants/lifemonk-theme';

const SHORTS_DATA = [
  { id: '91E0q4LRW_A', title: 'Deep Meditation', desc: 'Find your inner peace with this quick session.' },
  { id: '8vX-cAq8PPY', title: 'Focus Flow', desc: 'Boost your productivity in 60 seconds.' },
  { id: 'mTZFEvgGq14', title: 'Morning Ritual', desc: 'How to start your day for maximum success.' },
  { id: 'QwpdqMw01n8', title: 'Mindful Breathing', desc: 'Just breathe. A quick calming exercise.' },
  { id: 'phkKiB9re9U', title: 'The Monk Way', desc: 'Ancient wisdom for modern focus.' },
];

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ByteScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState<Record<number, boolean>>({});

  const openVideo = useCallback((id: string) => {
    Linking.openURL(`https://www.youtube.com/watch?v=${id}`);
  }, []);

  const toggleLike = useCallback((index: number) => {
    setLiked((prev) => ({ ...prev, [index]: !prev[index] }));
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: (typeof SHORTS_DATA)[0]; index: number }) => (
      <ByteItem
        video={item}
        index={index}
        isLiked={!!liked[index]}
        onPlay={() => openVideo(item.id)}
        onLike={() => toggleLike(index)}
        onShare={() => {}}
      />
    ),
    [liked, openVideo, toggleLike]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>BYTES</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={SHORTS_DATA}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </View>
  );
}

function ByteItem({
  video,
  index,
  isLiked,
  onPlay,
  onLike,
  onShare,
}: {
  video: (typeof SHORTS_DATA)[0];
  index: number;
  isLiked: boolean;
  onPlay: () => void;
  onLike: () => void;
  onShare: () => void;
}) {
  const thumbUrl = `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`;

  return (
    <View style={[styles.item, { height: SCREEN_HEIGHT }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onPlay}>
        <Image source={{ uri: thumbUrl }} style={styles.thumb} />
        <View style={styles.playOverlay}>
          <View style={styles.playBtn}>
            <Ionicons name="play" size={40} color="#FFF" />
          </View>
        </View>
      </Pressable>

      <View style={styles.info}>
        <Text style={styles.title}>{video.title}</Text>
        <Text style={styles.desc} numberOfLines={2}>{video.desc}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onLike} style={styles.actionBtn}>
          <View style={[styles.actionCircle, isLiked && styles.actionCircleLiked]}>
            <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={28} color={isLiked ? '#ef4444' : '#FFF'} />
          </View>
          <Text style={styles.actionLabel}>Like</Text>
        </Pressable>
        <Pressable onPress={onShare} style={styles.actionBtn}>
          <View style={styles.actionCircle}>
            <Ionicons name="share-outline" size={28} color="#FFF" />
          </View>
          <Text style={styles.actionLabel}>Share</Text>
        </Pressable>
      </View>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.gradient}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LifeMonkSpacing.contentPadding,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  headerRight: { width: 44 },
  list: { flex: 1 },
  item: { width: '100%', justifyContent: 'center', overflow: 'hidden' },
  thumb: { ...StyleSheet.absoluteFillObject, backgroundColor: '#111' },
  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  info: { position: 'absolute', left: 24, right: 80, bottom: 120, zIndex: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  desc: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  actions: { position: 'absolute', right: 24, bottom: 100, flexDirection: 'column', gap: 32, zIndex: 20 },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCircleLiked: {},
  actionLabel: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 2 },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
  },
});
