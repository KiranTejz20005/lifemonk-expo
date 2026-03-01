import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { OnboardingGate } from '@/components/OnboardingGate';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ONBOARDING_KEY = '@lifemonk/onboarding_completed';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setHasCompletedOnboarding(value === 'true');
    });
  }, []);

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
    AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  };

  if (hasCompletedOnboarding === null) {
    return null;
  }

  if (!hasCompletedOnboarding) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <OnboardingGate onComplete={completeOnboarding} />
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ animation: 'fade' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
