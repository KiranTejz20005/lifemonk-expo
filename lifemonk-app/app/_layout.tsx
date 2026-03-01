import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import * as SecureStore from 'expo-secure-store';

import { OnboardingGate } from '@/components/OnboardingGate';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { isLoggedIn, onAuthChange } from '@/src/services/auth';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const startApp = async () => {
      // TEMP: clear session for testing - remove before production
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_id');

      const loggedIn = await isLoggedIn();
      setAuthed(loggedIn);
    };

    startApp();

    // Listen for logout events
    const unsubscribe = onAuthChange(() => {
      setAuthed(false);
    });
    return unsubscribe;
  }, []);

  const completeAuth = () => {
    setAuthed(true);
  };

  if (authed === null) {
    return null;
  }

  if (!authed) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <OnboardingGate onComplete={completeAuth} />
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
