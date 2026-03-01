import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LifeMonkColors, LifeMonkSpacing, LifeMonkTypography } from '@/constants/lifemonk-theme';

export interface Inspiration {
  id: number;
  quote: string;
  author: string;
  img: string;
}

const CARD_WIDTH = 220;
const CARD_HEIGHT = 280;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function InspiredCarousel({ inspirations }: { inspirations: Inspiration[] }) {
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % inspirations.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [inspirations.length]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Be Inspired!</Text>
      <ScrollView
        horizontal
        pagingEnabled={false}
        snapToInterval={CARD_WIDTH + 16}
        snapToAlignment="center"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + 16));
          if (i >= 0 && i < inspirations.length) setCarouselIndex(i);
        }}
      >
        {inspirations.map((item, index) => {
          const isActive = index === carouselIndex;
          return (
            <Pressable
              key={item.id}
              onPress={() => setCarouselIndex(index)}
              style={[styles.card, !isActive && styles.cardInactive]}
            >
              <Image
                source={{ uri: `${item.img}?auto=format&fit=crop&q=80&w=600` }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.9)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.cardContent}>
                <Text style={styles.quote}>"{item.quote}"</Text>
                <Text style={styles.author}>{item.author}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.dots}>
        {inspirations.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => setCarouselIndex(i)}
            style={[styles.dot, i === carouselIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: LifeMonkSpacing.spacingLg,
  },
  title: {
    fontSize: LifeMonkTypography.fontXs,
    fontWeight: '800',
    color: LifeMonkColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: LifeMonkSpacing.spacingLg,
  },
  scrollContent: {
    paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2 - 8,
    gap: 16,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  cardInactive: {
    opacity: 0.7,
  },
  cardContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: LifeMonkSpacing.spacingMd,
  },
  quote: {
    fontSize: LifeMonkTypography.fontBase,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  author: {
    fontSize: LifeMonkTypography.fontXs,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: LifeMonkSpacing.spacingMd,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
  },
  dotActive: {
    width: 24,
    backgroundColor: LifeMonkColors.accentPrimary,
  },
});
