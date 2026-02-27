import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';

type ViewState = 'main' | 'payments' | 'privacy' | 'notifications' | 'help';

interface MoreScreenProps {
  onBack: () => void;
  onLogout?: () => void;
}

export function MoreScreen({ onBack, onLogout }: MoreScreenProps) {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<ViewState>('main');

  const headerTitle = view === 'main' ? 'Settings & More' : view.charAt(0).toUpperCase() + view.slice(1);
  const onHeaderBack = view === 'main' ? onBack : () => setView('main');

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable onPress={onHeaderBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color={LifeMonkColors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      {view === 'main' && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionLabel}>Your Current Plan</Text>
          <View style={styles.planCard}>
            <View style={styles.planRow}>
              <View>
                <Text style={styles.planTitle}>Pro Elite</Text>
                <View style={styles.planBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={LifeMonkColors.accentPrimary} />
                  <Text style={styles.planMeta}>Active until Dec 2026</Text>
                </View>
              </View>
              <Ionicons name="flash" size={40} color={LifeMonkColors.accentPrimary} />
            </View>
            <Pressable style={styles.manageBtn}>
              <Text style={styles.manageBtnText}>MANAGE SUBSCRIPTION</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Account Settings</Text>
          <SettingItem icon="card-outline" iconColor="#3b82f6" label="Payment Methods" onPress={() => setView('payments')} />
          <SettingItem icon="shield-checkmark-outline" iconColor="#10b981" label="Privacy & Security" onPress={() => setView('privacy')} />
          <SettingItem icon="notifications-outline" iconColor="#f97316" label="Notifications" onPress={() => setView('notifications')} />
          <SettingItem icon="help-circle-outline" iconColor="#6366f1" label="Help & Support" onPress={() => setView('help')} />

          <Pressable onPress={onLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>SIGN OUT</Text>
          </Pressable>
        </ScrollView>
      )}

      {view === 'payments' && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <PaymentItem icon="phone-portrait-outline" label="UPI (Google Pay, PhonePe)" color="#6366f1" />
          <PaymentItem icon="card-outline" label="Credit Card" color="#3b82f6" />
          <PaymentItem icon="card-outline" label="Debit Card" color="#10b981" />
          <PaymentItem icon="flash-outline" label="Insta Payment" color="#f97316" />
        </ScrollView>
      )}

      {view === 'privacy' && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.infoCard}>
            <View style={styles.infoTitleRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#10b981" />
            <Text style={styles.infoTitle}>Data Security</Text>
          </View>
            <Text style={styles.infoBody}>
              Your focus sessions and journal entries are encrypted end-to-end. We never share your personal growth data with outside third parties.
            </Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoTitleRow}>
            <Ionicons name="eye-outline" size={18} color="#3b82f6" />
            <Text style={styles.infoTitle}>Transparency</Text>
          </View>
            <Text style={styles.infoBody}>
              You have full control over your data. You can export or delete your entire history at any time from the account dashboard.
            </Text>
          </View>
        </ScrollView>
      )}

      {view === 'notifications' && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <NotifItem title="Upcoming Workshop" desc="Live 'Monk Mode' Masterclass starts today at 5:00 PM." time="2h ago" active />
          <NotifItem title="Weekly Report" desc="Your productivity increased by 15% this week! View details." time="1d ago" />
          <NotifItem title="New Feature" desc="Deep Work music now available in Focus mode." time="3d ago" />
        </ScrollView>
      )}

      {view === 'help' && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <FAQItem question="What is Monk Mode?" answer="Monk Mode is a period of deep focus and discipline where you commit to eliminating distractions and working towards a specific goal." />
          <FAQItem question="How do I earn tokens?" answer="Tokens are earned by completing daily focus sessions, finishing challenges, and maintaining your streaks." />
          <FAQItem question="Can I use Life Monk offline?" answer="Yes! Most features like the timer and journal work offline. Data will sync once you connect to the internet." />
          <FAQItem question="Is my data safe?" answer="Absolutely. We use industry-grade encryption to ensure your journals and goals are for your eyes only." />
        </ScrollView>
      )}
    </View>
  );
}

function SettingItem({
  icon,
  iconColor,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.settingItem}>
      <View style={styles.settingIconWrap}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={LifeMonkColors.textMuted} />
    </Pressable>
  );
}

function PaymentItem({ icon, label, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }) {
  return (
    <Pressable style={styles.paymentItem}>
      <View style={[styles.paymentIconWrap, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.paymentLabel}>{label}</Text>
      <Ionicons name="add" size={20} color={LifeMonkColors.textMuted} />
    </Pressable>
  );
}

function NotifItem({ title, desc, time, active }: { title: string; desc: string; time: string; active?: boolean }) {
  return (
    <View style={[styles.notifItem, active && styles.notifItemActive]}>
      <View style={styles.notifRow}>
        <Text style={styles.notifTitle}>{title}</Text>
        <Text style={styles.notifTime}>{time}</Text>
      </View>
      <Text style={styles.notifDesc}>{desc}</Text>
    </View>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View style={styles.faqItem}>
      <Pressable onPress={() => setIsOpen(!isOpen)} style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={LifeMonkColors.textMuted} />
      </Pressable>
      {isOpen && (
        <View style={styles.faqBody}>
          <Text style={styles.faqAnswer}>{answer}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LifeMonkSpacing.contentPadding,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
  scrollContent: { padding: LifeMonkSpacing.contentPadding, paddingBottom: 40 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: LifeMonkColors.textMuted, letterSpacing: 2, marginBottom: 16, paddingHorizontal: 8 },
  planCard: {
    backgroundColor: '#111',
    borderRadius: 36,
    padding: 32,
    marginBottom: 24,
  },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  planTitle: { fontSize: 28, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  planBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  planMeta: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  manageBtn: { backgroundColor: '#FFF', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  manageBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 20,
    borderRadius: 28,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  settingIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  settingLabel: { flex: 1, fontSize: 14, fontWeight: '800', color: LifeMonkColors.text },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 20,
    borderRadius: 28,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  paymentIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  paymentLabel: { flex: 1, fontSize: 14, fontWeight: '800', color: LifeMonkColors.text },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 24,
    borderRadius: 32,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  infoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  infoTitle: { fontSize: 16, fontWeight: '800', color: LifeMonkColors.text },
  infoBody: { fontSize: 14, color: LifeMonkColors.textSecondary, fontWeight: '700', lineHeight: 22 },
  notifItem: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    padding: 20,
    borderRadius: 32,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  notifItemActive: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderColor: 'rgba(110,68,255,0.2)',
  },
  notifRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  notifTitle: { fontSize: 14, fontWeight: '800', color: LifeMonkColors.text },
  notifTime: { fontSize: 10, fontWeight: '700', color: LifeMonkColors.textMuted },
  notifDesc: { fontSize: 12, color: LifeMonkColors.textSecondary, fontWeight: '700', lineHeight: 18 },
  faqItem: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 28,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '800', color: LifeMonkColors.text },
  faqBody: { paddingHorizontal: 20, paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#f9fafb' },
  faqAnswer: { fontSize: 12, color: LifeMonkColors.textSecondary, fontWeight: '700', lineHeight: 20, paddingTop: 12 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 28,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginTop: 24,
  },
  logoutText: { fontSize: 14, fontWeight: '800', color: '#ef4444' },
});
