import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';

const referrals = [
  { name: 'Rahul Sharma', date: 'Jan 12', bonus: '+$10' },
  { name: 'Siddharth Verma', date: 'Jan 10', bonus: '+$10' },
  { name: 'Ananya Iyer', date: 'Jan 05', bonus: '+5 Tokens' },
  { name: 'Vikram Mehta', date: 'Dec 28', bonus: '+$10' },
];

export function ReferScreen({ onBack, userName }: { onBack: () => void; userName: string }) {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);
  const referralLink = `lifemonk.app/refer/${userName.toLowerCase()}`;

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color={LifeMonkColors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Refer & Earn</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={[LifeMonkColors.accentPrimary, '#8E6AFF']}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="gift" size={32} color="#FFF" />
          </View>
          <Text style={styles.heroTitle}>{userName}'s Referral Dashboard</Text>
          <Text style={styles.heroDesc}>Share your link and earn $10 for every new monk!</Text>
        </LinearGradient>

        <View style={styles.linkCard}>
          <Text style={styles.linkLabel}>YOUR UNIQUE LINK</Text>
          <View style={styles.linkRow}>
            <Text style={styles.linkText} numberOfLines={1}>{referralLink}</Text>
            <Pressable
              onPress={copyToClipboard}
              style={[styles.copyBtn, copied && styles.copyBtnDone]}
            >
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color="#FFF" />
              <Text style={styles.copyBtnText}>{copied ? 'COPIED' : 'COPY'}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="people" size={20} color={LifeMonkColors.accentPrimary} />
              <Text style={styles.sectionTitle}>Successful Refers</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{referrals.length} Joined</Text>
            </View>
          </View>
          {referrals.map((ref, idx) => (
            <View key={idx} style={styles.refRow}>
              <View style={styles.refAvatar}>
                <Text style={styles.refAvatarText}>{ref.name[0]}</Text>
              </View>
              <View style={styles.refInfo}>
                <Text style={styles.refName}>{ref.name}</Text>
                <Text style={styles.refDate}>{ref.date}</Text>
              </View>
              <View style={styles.refRight}>
                <Text style={styles.refBonus}>{ref.bonus}</Text>
                <View style={styles.stars}>
                  {[1, 2, 3].map((s) => (
                    <Ionicons key={s} name="star" size={8} color="#fb923c" />
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LifeMonkSpacing.contentPadding,
    paddingBottom: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: LifeMonkColors.text },
  scroll: { flex: 1 },
  scrollContent: { padding: LifeMonkSpacing.contentPadding, paddingBottom: 40, gap: 24 },
  hero: {
    borderRadius: 36,
    padding: 32,
    alignItems: 'center',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 8, textAlign: 'center' },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', maxWidth: 200 },
  linkCard: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  linkLabel: { fontSize: 10, fontWeight: '800', color: LifeMonkColors.textMuted, letterSpacing: 2, marginBottom: 16, textAlign: 'center' },
  linkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', paddingLeft: 20, paddingRight: 8, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  linkText: { flex: 1, fontSize: 14, fontWeight: '700', color: LifeMonkColors.text },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: '#111' },
  copyBtnDone: { backgroundColor: '#10b981' },
  copyBtnText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  section: {},
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: LifeMonkColors.text },
  badge: { backgroundColor: 'rgba(110,68,255,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '800', color: LifeMonkColors.accentPrimary },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  refAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  refAvatarText: { fontSize: 12, fontWeight: '800', color: LifeMonkColors.accentPrimary },
  refInfo: { flex: 1 },
  refName: { fontSize: 14, fontWeight: '800', color: LifeMonkColors.text },
  refDate: { fontSize: 10, fontWeight: '700', color: LifeMonkColors.textMuted, marginTop: 2 },
  refRight: { alignItems: 'flex-end' },
  refBonus: { fontSize: 14, fontWeight: '800', color: '#059669' },
  stars: { flexDirection: 'row', gap: 2, marginTop: 2 },
});
