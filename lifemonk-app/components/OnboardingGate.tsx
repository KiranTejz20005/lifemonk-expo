import React, { useState } from 'react';
import { View } from 'react-native';

import { AuthLoginScreen } from '@/src/screens/AuthLoginScreen';
import { AuthSignupScreen } from '@/src/screens/AuthSignupScreen';
import { SplashScreen } from '@/components/screens/SplashScreen';

type Step = 'splash' | 'login' | 'signup';

export function OnboardingGate({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>('splash');

  if (step === 'splash') {
    return <SplashScreen onComplete={() => setStep('login')} />;
  }
  if (step === 'login') {
    return (
      <AuthLoginScreen
        onLoginSuccess={onComplete}
        onGoToSignup={() => setStep('signup')}
      />
    );
  }
  if (step === 'signup') {
    return (
      <AuthSignupScreen
        onSignupSuccess={onComplete}
        onGoToLogin={() => setStep('login')}
      />
    );
  }
  return <View />;
}
