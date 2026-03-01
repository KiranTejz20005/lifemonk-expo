import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';

export function LoginScreen({
  onLogin,
  onGuest,
}: {
  onLogin: (name?: string) => void;
  onGuest: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + LifeMonkSpacing.spacingXl, paddingBottom: insets.bottom + LifeMonkSpacing.spacingXl }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.logo}>lifemonk</Text>

      <View style={styles.illus}>
        <View style={[styles.circle, styles.circleYellow]} />
        <View style={[styles.circle, styles.circleGreen]} />
        <View style={[styles.circle, styles.circleBlue]} />
        <View style={[styles.circle, styles.circleOrange]} />
      </View>

      <Text style={styles.subtitle}>Sign in to get started</Text>

      <View style={styles.buttons}>
        <Button variant="google" onPress={() => onLogin('User')} fullWidth>
          Sign in with Google
        </Button>
        <Button variant="phone" onPress={() => onLogin('User')} fullWidth>
          Sign in with Phone
        </Button>
      </View>

      <Pressable onPress={onGuest} style={styles.guestRow}>
        <Ionicons name="compass-outline" size={24} color={LifeMonkColors.textMuted} />
        <Text style={styles.guestText}>Continue as Guest</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LifeMonkColors.bgApp },
  content: { flexGrow: 1, paddingHorizontal: LifeMonkSpacing.contentPadding, alignItems: 'center' },
  logo: { fontSize: 32, fontWeight: '800', letterSpacing: -0.02, color: '#111', marginBottom: 24 },
  illus: { width: 280, height: 280, marginBottom: 24, position: 'relative' },
  circle: { position: 'absolute', borderRadius: 9999, borderWidth: 3, borderColor: '#111' },
  circleYellow: { top: 0, right: 16, width: 120, height: 120, backgroundColor: '#FFD966' },
  circleGreen: { top: '20%', left: 0, width: 100, height: 100, backgroundColor: '#93C47D' },
  circleBlue: { bottom: '10%', left: '10%', width: 110, height: 110, backgroundColor: '#76A5AF' },
  circleOrange: { bottom: '20%', right: '10%', width: 50, height: 50, backgroundColor: '#E69138' },
  subtitle: { fontSize: 14, fontWeight: '800', color: '#8E8F94', letterSpacing: 2, marginBottom: 24 },
  buttons: { width: '100%', maxWidth: 320, gap: LifeMonkSpacing.spacingMd },
  guestRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 'auto', paddingVertical: 16 },
  guestText: { fontSize: 16, fontWeight: '800', color: '#8E8F94', textDecorationLine: 'underline' },
});
