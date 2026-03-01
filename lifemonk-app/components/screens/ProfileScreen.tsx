import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';
import { getProfile, getUserName, type AuthProfile } from '@/src/services/auth';

const PLAN_LABELS: Record<string, string> = {
  basic: 'Basic',
  premium: 'Premium',
  ultra: 'Ultra',
};

function planLabel(subscriptionType: string | undefined): string {
  if (!subscriptionType) return '—';
  const key = subscriptionType.toLowerCase();
  return PLAN_LABELS[key] ?? subscriptionType;
}

export function ProfileScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [fallbackName, setFallbackName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storedName = await getUserName();
      setFallbackName(storedName);
      const data = await getProfile();
      setProfile(data);
    } catch (e) {
      setProfile(null);
      setError(e instanceof Error ? e.message : 'Could not load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const displayName = profile?.name?.trim() || fallbackName?.trim() || 'Guest';
  const plan = planLabel(profile?.subscription_type);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={LifeMonkColors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={LifeMonkColors.primary} />
            <Text style={styles.loadingText}>Loading profile…</Text>
          </View>
        ) : error && !fallbackName ? (
          <View style={styles.card}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.bio}>Sign in to see your profile and plan.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.avatarWrap}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' }}
                style={StyleSheet.absoluteFill}
              />
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.bio}>Life Monk · Building better habits</Text>
            <View style={styles.planRow}>
              <Text style={styles.planLabel}>Plan</Text>
              <View style={[styles.planBadge, plan === 'Premium' && styles.planBadgePremium, plan === 'Ultra' && styles.planBadgeUltra]}>
                <Text style={styles.planBadgeText}>{plan}</Text>
              </View>
            </View>
            {error ? <Text style={styles.errorSubtext}>{error}</Text> : null}
          </View>
        )}
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: LifeMonkColors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: LifeMonkColors.text },
  scroll: { flex: 1 },
  scrollContent: { padding: LifeMonkSpacing.contentPadding, paddingBottom: 40 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: 'rgba(110,68,255,0.2)',
    marginBottom: 16,
  },
  name: { fontSize: 24, fontWeight: '800', color: LifeMonkColors.text, marginBottom: 4 },
  bio: { fontSize: 14, color: LifeMonkColors.textMuted, marginBottom: 16 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  planLabel: { fontSize: 14, fontWeight: '600', color: LifeMonkColors.textMuted },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(110,68,255,0.15)',
  },
  planBadgePremium: { backgroundColor: 'rgba(34,197,94,0.2)' },
  planBadgeUltra: { backgroundColor: 'rgba(234,179,8,0.25)' },
  planBadgeText: { fontSize: 14, fontWeight: '700', color: LifeMonkColors.text },
  loadingWrap: { padding: 40, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15, color: LifeMonkColors.textMuted },
  errorText: { fontSize: 16, color: '#EF4444', marginBottom: 8, fontWeight: '600' },
  errorSubtext: { fontSize: 12, color: '#EF4444', marginTop: 8 },
});
