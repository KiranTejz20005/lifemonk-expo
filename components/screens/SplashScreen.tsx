import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { LifeMonkColors } from '@/constants/lifemonk-theme';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => onComplete());
    }, 2000);
    return () => clearTimeout(t);
  }, [onComplete, opacity]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.title}>lifemonk</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: LifeMonkColors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -0.02,
    color: LifeMonkColors.text,
  },
});
