import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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

import { signup, saveSession } from '@/src/services/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PRIMARY = '#1e2235';
const ACCENT_BLUE = '#3b82f6';

type Step = 1 | 2 | 3;

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const GRADES = Array.from({ length: 12 }, (_: unknown, i: number) => i + 1);

const PLANS = [
  {
    key: 'basic',
    label: 'BASIC',
    price: 'Free',
    tagline: 'For school students',
    description: 'Access to school-assigned courses',
    borderColor: '#e8ecf0',
    highlighted: false,
  },
  {
    key: 'premium',
    label: 'PREMIUM',
    price: '\u20B9299/month',
    tagline: 'For independent learners',
    description: 'Access to premium course library',
    borderColor: ACCENT_BLUE,
    highlighted: false,
  },
  {
    key: 'ultra',
    label: 'ULTRA \u2B50',
    price: '\u20B9599/month',
    tagline: 'Full access',
    description: 'Full access to all courses + exclusive content',
    borderColor: PRIMARY,
    highlighted: true,
  },
] as const;

interface Props {
  onSignupSuccess: () => void;
  onGoToLogin: () => void;
}

export function AuthSignupScreen({ onSignupSuccess, onGoToLogin }: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  // --- Step 1: Validate personal info ---
  const handleStep1Continue = () => {
    if (!formData.name.trim()) { setError('Name is required.'); return; }
    if (!formData.email.trim()) { setError('Email is required.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) { setError('Enter a valid email.'); return; }
    if (!formData.password) { setError('Password is required.'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; }
    setError(null);
    setStep(2);
  };

  // --- Step 2: Grade selected ---
  const handleStep2Continue = () => {
    if (!selectedGrade) return;
    setStep(3);
  };

  // --- Step 3: Final submit (ONLY place that calls the signup API) ---
  const handleSubmit = async () => {
    if (!selectedGrade || !selectedPlan) return;
    setLoading(true);
    setError(null);
    try {
      console.log('Final signup data:', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        grade_level: selectedGrade,
        subscription_type: selectedPlan,
      });

      const result = await signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        grade_level: selectedGrade,
        subscription_type: selectedPlan,
      });

      console.log('Signup result:', JSON.stringify(result));

      const resultKeys = result && typeof result === 'object' ? Object.keys(result as Record<string, unknown>) : [];
      console.log('Result keys:', resultKeys);

      await saveSession(
        (result as { authToken: string }).authToken,
        String((result as { id?: number | string }).id ?? ''),
        (result as { name?: string }).name
      );
      onSignupSuccess();
    } catch (e: unknown) {
      console.log('[Signup] Error caught:', e);

      let message = 'Signup failed. Please try again.';
      if (e instanceof TypeError && e.message === 'Network request failed') {
        message = 'Network error, check connection.';
      } else if (e instanceof Error) {
        message = e.message;
      }

      setError(message);
      // Stay on step 3 so the user sees the error here, NOT bounced back to step 1
    } finally {
      setLoading(false);
    }
  };

  // ---- Step indicators ----
  const renderStepDots = () => (
    <View style={styles.stepRow}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]} />
      ))}
    </View>
  );

  // ========== STEP 1: Personal Info ==========
  if (step === 1) {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={onGoToLogin} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={PRIMARY} />
          </Pressable>

          {renderStepDots()}

          <Text style={styles.heading}>Create Account</Text>
          <Text style={styles.subheading}>Join LifeMonk today</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              value={formData.name}
              onChangeText={(t: string) => updateField('name', t)}
            />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={formData.email}
              onChangeText={(t: string) => updateField('email', t)}
            />
            <PasswordInput
              placeholder="Password"
              value={formData.password}
              onChangeText={(t: string) => updateField('password', t)}
            />
            <PasswordInput
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(t: string) => updateField('confirmPassword', t)}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable style={styles.primaryBtn} onPress={handleStep1Continue}>
              <Text style={styles.primaryBtnText}>Continue</Text>
            </Pressable>

            <Pressable onPress={onGoToLogin} style={styles.loginLink}>
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ========== STEP 2: Grade Selection ==========
  if (step === 2) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
        <View style={styles.padH}>
          <Pressable onPress={() => setStep(1)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={PRIMARY} />
          </Pressable>
          {renderStepDots()}
          <Text style={styles.heading}>What grade are you in?</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.gradeScroll, { paddingBottom: insets.bottom + 100 }]}
        >
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
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable
            style={[styles.primaryBtn, !selectedGrade && styles.btnDisabled]}
            onPress={handleStep2Continue}
            disabled={!selectedGrade}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ========== STEP 3: Plan Selection ==========
  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <View style={styles.padH}>
        <Pressable onPress={() => setStep(2)} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={PRIMARY} />
        </Pressable>
        {renderStepDots()}
        <Text style={styles.heading}>Choose your plan</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.planScroll, { paddingBottom: insets.bottom + 100 }]}
      >
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.key;
          return (
            <Pressable
              key={plan.key}
              style={[
                styles.planCard,
                { borderColor: plan.borderColor },
                plan.highlighted && !isSelected && styles.planCardHighlighted,
                isSelected && styles.planCardActive,
              ]}
              onPress={() => setSelectedPlan(plan.key)}
            >
              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planLabel, plan.highlighted && !isSelected && styles.planLabelLight]}>
                    {plan.label}
                  </Text>
                  <Text style={[styles.planPrice, plan.highlighted && !isSelected && styles.planPriceLight]}>
                    {plan.price}
                  </Text>
                </View>
                {isSelected ? (
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  </View>
                ) : null}
              </View>
              <Text style={[styles.planTagline, plan.highlighted && !isSelected && styles.planTaglineLight]}>
                {plan.tagline}
              </Text>
              <Text style={[styles.planDesc, plan.highlighted && !isSelected && styles.planDescLight]}>
                {plan.description}
              </Text>
            </Pressable>
          );
        })}

        {error ? <Text style={[styles.errorText, { marginHorizontal: 24 }]}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable
          style={[styles.primaryBtn, (!selectedPlan || loading) && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={!selectedPlan || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>Create Account</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// --- Reusable password input with toggle ---
function PasswordInput({
  placeholder,
  value,
  onChangeText,
}: {
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.passwordWrap}>
      <TextInput
        style={[styles.input, styles.passwordField]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={!show}
        value={value}
        onChangeText={onChangeText}
      />
      <Pressable style={styles.eyeBtn} onPress={() => setShow((p) => !p)}>
        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={22} color="#9CA3AF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  padH: { paddingHorizontal: 24 },

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

  stepRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  stepDot: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
  stepDotActive: { backgroundColor: PRIMARY },

  heading: { fontSize: 28, fontWeight: '800', color: PRIMARY, marginBottom: 6 },
  subheading: { fontSize: 15, color: '#718096', marginBottom: 28 },

  form: { width: '100%' },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#e8ecf0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: PRIMARY,
    marginBottom: 12,
  },
  passwordWrap: { position: 'relative' },
  passwordField: { paddingRight: 50 },
  eyeBtn: { position: 'absolute', right: 14, top: 14, padding: 2 },

  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600', marginBottom: 12, marginLeft: 4 },

  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  loginLink: { alignItems: 'center', marginTop: 20 },
  loginLinkText: { fontSize: 14, color: '#718096' },
  loginLinkBold: { fontWeight: '700', color: PRIMARY },

  // Grade grid
  gradeScroll: { paddingHorizontal: 24, paddingTop: 16 },
  gradeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gradeCard: {
    width: (SCREEN_WIDTH - 48 - 20) / 3,
    paddingVertical: 18,
    borderRadius: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#e8ecf0',
    alignItems: 'center',
  },
  gradeCardSelected: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  gradeCardText: { fontSize: 14, fontWeight: '700', color: PRIMARY },
  gradeCardTextSelected: { color: '#FFF' },

  // Plan cards
  planScroll: { paddingHorizontal: 24, paddingTop: 16, gap: 12 },
  planCard: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 20,
    backgroundColor: '#FFF',
  },
  planCardHighlighted: { backgroundColor: PRIMARY },
  planCardActive: { borderColor: PRIMARY, borderWidth: 2.5, backgroundColor: '#F0F4FF' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  planLabel: { fontSize: 16, fontWeight: '800', color: PRIMARY },
  planLabelLight: { color: '#FFF' },
  planPrice: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginTop: 2 },
  planPriceLight: { color: 'rgba(255,255,255,0.8)' },
  planTagline: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 4 },
  planTaglineLight: { color: 'rgba(255,255,255,0.9)' },
  planDesc: { fontSize: 12, color: '#9CA3AF' },
  planDescLight: { color: 'rgba(255,255,255,0.7)' },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: '#F9FAFB',
  },
});
