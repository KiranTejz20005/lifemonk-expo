import React, { useState } from 'react';
import { View } from 'react-native';

import { LoginScreen } from '@/components/screens/LoginScreen';
import { OnboardingStep1 } from '@/components/screens/OnboardingStep1';
import { OnboardingStep2 } from '@/components/screens/OnboardingStep2';
import { SplashScreen } from '@/components/screens/SplashScreen';

type Step = 'splash' | 'login' | 'onboarding1' | 'onboarding2';

export function OnboardingGate({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>('splash');
  const [userName, setUserName] = useState('Guest');

  if (step === 'splash') {
    return <SplashScreen onComplete={() => setStep('login')} />;
  }
  if (step === 'login') {
    return (
      <LoginScreen
        onLogin={(name) => {
          setUserName(name || 'User');
          setStep('onboarding1');
        }}
        onGuest={() => onComplete()}
      />
    );
  }
  if (step === 'onboarding1') {
    return (
      <OnboardingStep1
        onNext={(name) => {
          setUserName(name);
          setStep('onboarding2');
        }}
        onBack={() => setStep('login')}
        onSkip={() => onComplete()}
      />
    );
  }
  if (step === 'onboarding2') {
    return (
      <OnboardingStep2
        onComplete={() => onComplete()}
        onBack={() => setStep('onboarding1')}
        onSkip={() => onComplete()}
      />
    );
  }
  return <View />;
}
