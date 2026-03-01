import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { registerStudent, saveStudentId } from '@/src/services/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PRIMARY = '#1e2235';
const ACCENT = '#667eea';
const GRADIENT_START = '#667eea';
const GRADIENT_END = '#764ba2';

type Step = 'welcome' | 'info' | 'grade';

interface FormData {
  name: string;
  email: string;
}

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

const PLANS = [
  { key: 'basic', label: 'BASIC', sublabel: 'Free', description: 'School students', highlighted: false },
  { key: 'premium', label: 'PREMIUM', sublabel: '', description: 'Independent learner', highlighted: false },
  { key: 'ultra', label: 'ULTRA', sublabel: '⭐', description: 'Full access', highlighted: true },
] as const;

export function OnboardingScreen({ onComplete, isGuest = false }: { onComplete: () => void; isGuest?: boolean }) {
  const insets = useSafeAreaInsets();
  // Guests skip welcome & info steps, go straight to grade selection
  const [step, setStep] = useState<Step>(isGuest ? 'grade' : 'welcome');
  const [formData, setFormData] = useState<FormData>(isGuest
    ? { name: 'Guest', email: `guest_${Date.now()}@lifemonk.com` }
    : { name: '', email: '' }
  );
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(isGuest ? 'basic' : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (nextStep: Step) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const handleContinueInfo = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setInfoError('Please enter both name and email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setInfoError('Please enter a valid email address.');
      return;
    }
    setInfoError(null);
    animateTransition('grade');
  };

  const handleSubmit = async () => {
    if (!selectedGrade || !selectedPlan) return;
    setLoading(true);
    setError(null);
    try {
      const result = await registerStudent({
        name: formData.name.trim(),
        email: formData.email.trim(),
        grade_level: selectedGrade,
        subscription_type: selectedPlan,
      });
      if (result?.student_id) {
        await saveStudentId(result.student_id);
      }
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---- STEP A: Welcome ----
  if (step === 'welcome') {
    return (
      <LinearGradient colors={[GRADIENT_START, GRADIENT_END]} style={styles.gradientFull}>
        <View style={[styles.welcomeContainer, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
          <View style={styles.welcomeTop}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>LM</Text>
            </View>
            <Text style={styles.welcomeTitle}>Welcome to LifeMonk</Text>
            <Text style={styles.welcomeSubtitle}>Your personalized learning journey starts here</Text>
          </View>
          <Pressable style={styles.getStartedBtn} onPress={() => animateTransition('info')}>
            <Text style={styles.getStartedText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color={ACCENT} />
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  // ---- STEP B: Personal Info ----
  if (step === 'info') {
    return (
      <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.infoContainer, { paddingTop: insets.top + 20 }]}>
            <Pressable onPress={() => animateTransition('welcome')} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={PRIMARY} />
            </Pressable>

            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, styles.stepDotActive]} />
              <View style={styles.stepDot} />
            </View>

            <Text style={styles.sectionTitle}>Tell us about yourself</Text>
            <Text style={styles.sectionSubtitle}>We&apos;ll personalize your experience</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>YOUR NAME</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="What should we call you?"
                  placeholderTextColor="#9CA3AF"
                  value={formData.name}
                  onChangeText={(t: string) => { setFormData((p: FormData) => ({ ...p, name: t })); setInfoError(null); }}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="your@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={formData.email}
                  onChangeText={(t: string) => { setFormData((p: FormData) => ({ ...p, email: t })); setInfoError(null); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {infoError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{infoError}</Text>
              </View>
            ) : null}

            <View style={styles.spacer} />

            <View style={[styles.footerArea, { paddingBottom: insets.bottom + 24 }]}>
              <Pressable
                style={[styles.continueBtn, (!formData.name.trim() || !formData.email.trim()) && styles.btnDisabled]}
                onPress={handleContinueInfo}
              >
                <Text style={styles.continueBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    );
  }

  // ---- STEP C: Grade & Plan ----
  return (
    <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
      <View style={[styles.gradeContainer, { paddingTop: insets.top + 20 }]}>
        <Pressable onPress={() => animateTransition('info')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={PRIMARY} />
        </Pressable>

        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gradeScroll}>
          <Text style={styles.sectionTitle}>Select Your Grade</Text>

          <View style={styles.gradeGrid}>
            {GRADES.map((g) => (
              <Pressable
                key={g}
                style={[styles.gradeCard, selectedGrade === g && styles.gradeCardSelected]}
                onPress={() => setSelectedGrade(g)}
              >
                <Text style={[styles.gradeCardText, selectedGrade === g && styles.gradeCardTextSelected]}>
                  Grade {g}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Select Your Plan</Text>

          <View style={styles.planRow}>
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.key;
              return (
                <Pressable
                  key={plan.key}
                  style={[
                    styles.planCard,
                    plan.highlighted && !isSelected && styles.planCardHighlighted,
                    isSelected && styles.planCardSelected,
                  ]}
                  onPress={() => setSelectedPlan(plan.key)}
                >
                  {isSelected ? (
                    <View style={styles.checkCircle}>
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    </View>
                  ) : null}
                  <Text style={[styles.planLabel, isSelected && styles.planLabelSelected]}>
                    {plan.label} {plan.sublabel}
                  </Text>
                  {plan.key === 'basic' ? <Text style={[styles.planFree, isSelected && styles.planFreeSelected]}>(free)</Text> : null}
                  <Text style={[styles.planDesc, isSelected && styles.planDescSelected]}>{plan.description}</Text>
                </Pressable>
              );
            })}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={[styles.footerArea, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable
            style={[styles.submitBtn, (!selectedGrade || !selectedPlan || loading) && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!selectedGrade || !selectedPlan || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Start Learning</Text>
                <Ionicons name="rocket-outline" size={18} color="#FFF" />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // Welcome
  gradientFull: { flex: 1 },
  welcomeContainer: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 32 },
  welcomeTop: { alignItems: 'center', marginTop: 60 },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoText: { fontSize: 36, fontWeight: '800', color: '#FFF' },
  welcomeTitle: { fontSize: 32, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 12 },
  welcomeSubtitle: { fontSize: 17, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24 },
  getStartedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  getStartedText: { fontSize: 18, fontWeight: '700', color: ACCENT },

  // Common
  screenContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  stepIndicator: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  stepDot: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
  stepDotActive: { backgroundColor: ACCENT },
  sectionTitle: { fontSize: 28, fontWeight: '800', color: PRIMARY, marginBottom: 6 },
  sectionSubtitle: { fontSize: 15, color: '#6B7280', marginBottom: 28 },
  spacer: { flex: 1 },

  // Info inputs
  infoContainer: { flex: 1, paddingHorizontal: 24 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: PRIMARY, letterSpacing: 2, marginBottom: 8, marginLeft: 4 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 16, color: PRIMARY },

  // Errors
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingHorizontal: 4 },
  errorText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },

  // Footer
  footerArea: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: '#F9FAFB' },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ACCENT,
    height: 56,
    borderRadius: 20,
  },
  continueBtnText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  btnDisabled: { opacity: 0.5 },

  // Grade
  gradeContainer: { flex: 1, paddingHorizontal: 24 },
  gradeScroll: { paddingBottom: 24 },
  gradeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  gradeCard: {
    width: (SCREEN_WIDTH - 48 - 20) / 3,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  gradeCardSelected: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  gradeCardText: { fontSize: 14, fontWeight: '700', color: PRIMARY },
  gradeCardTextSelected: { color: '#FFF' },

  // Plans
  planRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  planCard: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    position: 'relative',
  },
  planCardHighlighted: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  planCardSelected: { borderColor: ACCENT, borderWidth: 2.5, backgroundColor: '#EEF2FF' },
  planLabel: { fontSize: 13, fontWeight: '800', color: PRIMARY, marginBottom: 2 },
  planLabelSelected: { color: ACCENT },
  planFree: { fontSize: 11, color: '#6B7280', marginBottom: 4 },
  planFreeSelected: { color: ACCENT },
  planDesc: { fontSize: 11, color: '#9CA3AF', textAlign: 'center' },
  planDescSelected: { color: '#6B7280' },

  checkCircle: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ACCENT,
    height: 56,
    borderRadius: 20,
  },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
});
